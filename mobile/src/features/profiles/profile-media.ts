import { useMutation, useQueryClient } from '@tanstack/react-query';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';

import { reportTelemetryEvent } from '@/src/features/observability/telemetry';
import { supabase } from '@/src/shared/api/supabase/client';

export const PROFILE_MEDIA_BUCKET = 'profile-media';
export const BAR_MEDIA_LIMIT = 4;
export const ARTIST_MEDIA_LIMIT = 6;

export type ProfileMediaAsset = {
  createdAt: string;
  fileSizeBytes: number | null;
  height: number | null;
  id: string;
  mimeType: string | null;
  publicUrl: string;
  sortOrder: number;
  storagePath: string;
  width: number | null;
};

type UploadProfileMediaInput = {
  nextSortOrder: number;
  selectionLimit: number;
};

type DeleteProfileMediaInput = {
  assetId: string;
  storagePath: string;
};

type ProfileTarget = 'bar' | 'musician';

async function requireAuthenticatedUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('Sessao expirada. Entre novamente para editar o perfil.');
  }

  return user.id;
}

async function uploadProfileImages(target: ProfileTarget, input: UploadProfileMediaInput) {
  const selectionLimit = Math.max(0, Math.min(input.selectionLimit, target === 'bar' ? BAR_MEDIA_LIMIT : ARTIST_MEDIA_LIMIT));

  if (selectionLimit === 0) {
    return 0;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Autorize o acesso a fotos do aparelho para enviar imagens ao perfil.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: selectionLimit > 1,
    base64: true,
    mediaTypes: ['images'],
    quality: 0.75,
    selectionLimit,
  });

  if (result.canceled) {
    return 0;
  }

  const userId = await requireAuthenticatedUserId();
  const ownerColumn = target === 'bar' ? 'venue_id' : 'artist_id';
  const tableName = target === 'bar' ? 'venue_media_assets' : 'artist_media_assets';
  const folderName = target === 'bar' ? 'bar' : 'musician';

  for (const [index, asset] of result.assets.entries()) {
    const extension = inferImageExtension(asset);
    const storagePath = `${userId}/${folderName}/${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const mimeType = asset.mimeType ?? inferMimeTypeFromExtension(extension);
    const fileBody = await convertAssetToArrayBuffer(asset, mimeType);

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_MEDIA_BUCKET)
      .upload(storagePath, fileBody, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from(PROFILE_MEDIA_BUCKET).getPublicUrl(storagePath);
    const insertPayload = {
      created_at: new Date().toISOString(),
      file_size_bytes: asset.fileSize ?? null,
      height: asset.height || null,
      mime_type: mimeType,
      public_url: publicUrlData.publicUrl,
      sort_order: input.nextSortOrder + index,
      storage_path: storagePath,
      [ownerColumn]: userId,
      width: asset.width || null,
    };

    const { error: insertError } = await supabase.from(tableName).insert(insertPayload);

    if (insertError) {
      await supabase.storage.from(PROFILE_MEDIA_BUCKET).remove([storagePath]);
      throw insertError;
    }
  }

  reportTelemetryEvent({
    accountId: userId,
    accountType: target === 'bar' ? 'bar' : 'musician',
    context: {
      assetCount: result.assets.length,
      target,
    },
    eventName: 'profile_media_uploaded',
    pathname: target === 'bar' ? '/bar/profile' : '/musician/profile',
  });
  return result.assets.length;
}

async function deleteProfileImage(target: ProfileTarget, input: DeleteProfileMediaInput) {
  const userId = await requireAuthenticatedUserId();
  const ownerColumn = target === 'bar' ? 'venue_id' : 'artist_id';
  const tableName = target === 'bar' ? 'venue_media_assets' : 'artist_media_assets';

  const { error: deleteRowError } = await supabase
    .from(tableName)
    .delete()
    .eq('id', input.assetId)
    .eq(ownerColumn, userId);

  if (deleteRowError) {
    throw deleteRowError;
  }

  const { error: deleteStorageError } = await supabase.storage
    .from(PROFILE_MEDIA_BUCKET)
    .remove([input.storagePath]);

  if (deleteStorageError) {
    console.warn('Falha ao remover objeto do storage apos excluir a midia do perfil.', deleteStorageError);
  }

  reportTelemetryEvent({
    accountId: userId,
    accountType: target === 'bar' ? 'bar' : 'musician',
    context: {
      assetId: input.assetId,
      target,
    },
    eventName: 'profile_media_deleted',
    pathname: target === 'bar' ? '/bar/profile' : '/musician/profile',
  });
}

async function convertAssetToArrayBuffer(
  asset: ImagePicker.ImagePickerAsset,
  _mimeType: string,
) {
  if (!asset.base64) {
    throw new Error('Nao foi possivel preparar a imagem selecionada para upload.');
  }

  return decode(asset.base64);
}

function inferImageExtension(asset: ImagePicker.ImagePickerAsset) {
  const fileName = asset.fileName?.trim().toLowerCase();

  if (fileName && fileName.includes('.')) {
    const extension = fileName.split('.').pop();

    if (extension) {
      return extension.replace(/[^a-z0-9]/g, '') || 'jpg';
    }
  }

  if (asset.mimeType?.includes('/')) {
    const subtype = asset.mimeType.split('/').pop()?.toLowerCase();

    if (subtype) {
      if (subtype === 'jpeg') {
        return 'jpg';
      }

      return subtype.replace(/[^a-z0-9]/g, '') || 'jpg';
    }
  }

  return 'jpg';
}

function inferMimeTypeFromExtension(extension: string) {
  switch (extension.toLowerCase()) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

export function useUploadVenueMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile-media', 'bar', 'upload'],
    mutationFn: (input: UploadProfileMediaInput) => uploadProfileImages('bar', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-editor', 'bar'] }),
        queryClient.invalidateQueries({ queryKey: ['registration-snapshot'] }),
      ]);
    },
  });
}

export function useDeleteVenueMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile-media', 'bar', 'delete'],
    mutationFn: (input: DeleteProfileMediaInput) => deleteProfileImage('bar', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-editor', 'bar'] }),
        queryClient.invalidateQueries({ queryKey: ['registration-snapshot'] }),
      ]);
    },
  });
}

export function useUploadArtistMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile-media', 'musician', 'upload'],
    mutationFn: (input: UploadProfileMediaInput) => uploadProfileImages('musician', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-editor', 'musician'] }),
        queryClient.invalidateQueries({ queryKey: ['registration-snapshot'] }),
      ]);
    },
  });
}

export function useDeleteArtistMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['profile-media', 'musician', 'delete'],
    mutationFn: (input: DeleteProfileMediaInput) => deleteProfileImage('musician', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-editor', 'musician'] }),
        queryClient.invalidateQueries({ queryKey: ['registration-snapshot'] }),
      ]);
    },
  });
}
