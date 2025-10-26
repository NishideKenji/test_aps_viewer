import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import type { Role } from '@prisma/client'
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
  objectValue: Role
}

const updateCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
})

/**
 * 機能：Roleの作成・更新・削除を行うコンポーネント
 * @param param0
 * @returns
 */
export const RoleDetails = ({ objectValue }: Props) => {
  const router = useRouter()
  const { data: session } = useSession()

  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const create = trpc.roleRouter.create.useMutation()
  const update = trpc.roleRouter.update.useMutation()
  const roleDelete = trpc.roleRouter.delete.useMutation()
  const initialize = trpc.roleRouter.initialize.useMutation()
  //  const tempUserset = trpc.roleRouter.tempUserset.useMutation()

  const { refetch: updatetextlistRefetch } = trpc.roleRouter.list.useQuery()

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
              await router.push(`/admin/role/${res?.id}`)
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
          {...register('name')}
          fullWidth
          margin={'normal'}
          label="Name"
          type="text"
          error={formState.touchedFields.name && Boolean(formState.errors.name)}
          helperText={
            formState.touchedFields.name && formState.errors?.name?.message
          }
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
              const res = await roleDelete.mutateAsync({
                id: objectValue.id,
              })
              await updatetextlistRefetch()
              enqueueSnackbar('Role Deleted', { variant: 'success' })
              await router.push(`/admin/role`)
            } catch (error) {
              enqueueSnackbar('Updated error:', { variant: 'error' })
            }
          }
        }}
      >
        Delete
      </Button>

      <br />
      <br />

      <hr />

      <Typography variant="h5" gutterBottom>
        Roles初期化(初回設定のみ使用)
      </Typography>
      <Button
        disabled={
          //初期化機能だけは、sessinの権限チェックを行わない(アクティベート前の動作になるので誰でも可能とする)
          !session || isSubmittingDelete
        }
        type="submit"
        variant="contained"
        color="warning"
        onClick={async () => {
          setIsSubmittingDelete(true)

          try {
            const res = await initialize.mutateAsync()
            await updatetextlistRefetch()
            enqueueSnackbar('Role Initialized', { variant: 'success' })
            await router.push(`/admin/role`)
          } catch (error) {
            enqueueSnackbar('Updated error:', { variant: 'error' })
          }
        }}
      >
        RoleInitialize
      </Button>
      {/*
      <br />
      <br />

      <hr />

      <Typography variant="h5" gutterBottom>
        UserAdmin付与(初回設定のみ使用)
      </Typography>
      <Button
        disabled={
          //初期化機能だけは、sessinの権限チェックを行わない(アクティベート前の動作になるので誰でも可能とする)
          !session || isSubmittingDelete
        }
        type="submit"
        variant="contained"
        color="warning"
        onClick={async () => {
          setIsSubmittingDelete(true)

          try {
            const res = await tempUserset.mutateAsync()
            await updatetextlistRefetch()
            enqueueSnackbar('tempUser Initialized', { variant: 'success' })
            await router.push(`/admin/role`)
          } catch (error) {
            enqueueSnackbar('Updated error:', { variant: 'error' })
          }
        }}
      >
        UserInitialize
      </Button> */}
    </Box>
  )
}
