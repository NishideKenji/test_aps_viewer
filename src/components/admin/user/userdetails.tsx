import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import type { Role, User } from '@prisma/client'
import { TRPCClientError } from '@trpc/client'
import { useRouter } from 'next/router'
import { enqueueSnackbar } from 'notistack'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { trpc } from '@/utils/trpc'

interface Props {
  objectValue: User
  roleList: Role[]
}

const updateCreateSchema = z.object({
  id: z.string(),
  roleId: z.string().nullable(),
})

//Userのロールを更新するためのコンポーネント
export const UserDetails = ({ objectValue, roleList }: Props) => {
  const router = useRouter()

  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const updateRoleId = trpc.userRouter.updateRoleId.useMutation()
  const userDelete = trpc.userRouter.delete.useMutation()

  const { refetch: updatetextlistRefetch } = trpc.userRouter.list.useQuery()

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
          if (objectValue.id) {
            try {
              //console.log(value)
              const res = await updateRoleId.mutateAsync({
                id: objectValue.id,
                roleId: value.roleId === '' ? null : value.roleId,
              })
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
        <Controller
          name="roleId"
          control={control}
          rules={{
            validate: (form) => {
              if (!form) {
                return '選択をしてください'
              }
            },
          }}
          defaultValue={objectValue.roleId || ''}
          render={({ field, formState: { errors } }) => (
            <FormControl fullWidth error={errors.roleId ? true : false}>
              <InputLabel id="select-label">select</InputLabel>
              <Select
                labelId="select-label"
                id="select-label"
                label="Select"
                {...field}
                value={field.value || ''} // nullまたはundefinedの場合、空文字列に設定
              >
                {roleList.map((selection, i) => (
                  <MenuItem key={i} value={selection.id}>
                    {selection.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.roleId?.message || ''}</FormHelperText>
            </FormControl>
          )}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={
            !formState.isValid || !formState.isDirty || formState.isSubmitting
          }
        >
          {'Update'}
        </Button>
        {formState.isSubmitted && !formState.isSubmitSuccessful && (
          <Alert severity="error">{formState.errors.root?.message}</Alert>
        )}
      </form>

      <br />

      <Button
        disabled={isSubmittingDelete || objectValue.id === ''}
        type="submit"
        variant="contained"
        color="warning"
        onClick={async () => {
          setIsSubmittingDelete(true)

          if (objectValue.id !== '') {
            try {
              const res = await userDelete.mutateAsync({
                id: objectValue.id,
              })
              await updatetextlistRefetch()
              enqueueSnackbar('User Deleted', { variant: 'success' })
              await router.push(`/admin/user`)
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
