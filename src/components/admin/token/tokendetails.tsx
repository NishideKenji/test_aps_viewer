import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import type { Token } from '@prisma/client'
import { TRPCClientError } from '@trpc/client'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { enqueueSnackbar } from 'notistack'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PermitedRoleListAdmin } from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'
import { trpc } from '@/utils/trpc'

interface Props {
  objectValue: Token
}

const updateCreateSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  token: z.string().nullable(),
})

/**
 * 機能：Roleの作成・更新・削除を行うコンポーネント
 * @param param0
 * @returns
 */
export const TokenDetails = ({ objectValue }: Props) => {
  const router = useRouter()
  const { data: session } = useSession()

  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const create = trpc.tokenRouter.create.useMutation()
  const update = trpc.tokenRouter.update.useMutation()
  const tokenDelete = trpc.tokenRouter.delete.useMutation()

  const { refetch: updatetextlistRefetch } = trpc.tokenRouter.list.useQuery()

  const { register, handleSubmit, control, formState, reset, setError } =
    useForm({
      defaultValues: objectValue,
      resolver: zodResolver(updateCreateSchema),
      mode: 'onTouched',
    })

  useEffect(() => {
    if (objectValue) {
      reset(objectValue)
    }
  }, [objectValue, reset])

  return (
    <Box component="div">
      <form
        onSubmit={handleSubmit(async (value) => {
          if (objectValue.id === '') {
            try {
              const res = await create.mutateAsync(value)
              await updatetextlistRefetch()
              enqueueSnackbar('Create Success', { variant: 'success' })
              reset(res)
              await router.push(`/admin/tokenupd/${res?.id}`)
            } catch (error) {
              enqueueSnackbar('Create error:', { variant: 'error' })

              if (error instanceof TRPCClientError) {
                setError('root', {
                  type: 'manual',
                  message: error.message,
                })
              }
            }
          } else {
            try {
              //console.log(value)
              const res = await update.mutateAsync(value)
              await updatetextlistRefetch()
              enqueueSnackbar('Updated Success', { variant: 'success' })
              reset(value)
            } catch (error) {
              enqueueSnackbar('Updated error:', { variant: 'error' })

              if (error instanceof TRPCClientError) {
                setError('root', {
                  type: 'manual',
                  message: error.message,
                })
              }
            }
          }
        })}
      >
        <TextField
          {...register('type')}
          fullWidth
          margin={'normal'}
          label="Type"
          type="text"
          error={formState.touchedFields.type && Boolean(formState.errors.type)}
          helperText={
            formState.touchedFields.type && formState.errors?.type?.message
          }
        />

        <TextField
          {...register('token')}
          fullWidth
          margin={'normal'}
          multiline
          rows={3}
          label="token ※DB保管済みの値は表示されません。 新しい値を設定する場合のみ入力してください。"
          type="text"
          error={
            formState.touchedFields.token && Boolean(formState.errors.token)
          }
          helperText={
            formState.touchedFields.token && formState.errors?.token?.message
          }
          sx={{
            '& .MuiInputBase-inputMultiline': {
              resize: 'both', // 右下ドラッグでサイズ変更
              overflow: 'auto', // スクロール可
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={
            !checkIsAuthorized(session, PermitedRoleListAdmin) ||
            !formState.isValid ||
            !formState.isDirty ||
            formState.isSubmitting
          }
        >
          {objectValue.id === '' ? 'Create' : 'Update'}
        </Button>
        {formState.isSubmitted && !formState.isSubmitSuccessful && (
          <Alert severity="error">{formState.errors.root?.message}</Alert>
        )}
      </form>
      <br />

      <Button
        disabled={
          !checkIsAuthorized(session, PermitedRoleListAdmin) ||
          isSubmittingDelete ||
          objectValue.id === ''
        }
        type="submit"
        variant="contained"
        color="warning"
        onClick={async () => {
          setIsSubmittingDelete(true)

          if (objectValue.id !== '') {
            try {
              const res = await tokenDelete.mutateAsync({
                id: objectValue.id,
              })
              await updatetextlistRefetch()
              enqueueSnackbar('Token Deleted', { variant: 'success' })
              await router.push(`/admin/tokenupd/`)
            } catch (error) {
              enqueueSnackbar('Updated error:', { variant: 'error' })
            }
          }
        }}
      >
        Delete
      </Button>
    </Box>
  )
}
