import {
  AppBar,
  Button,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function NavBar() {
  const { data: session } = useSession()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Logo
        </Typography>
        <Link href="/">
          <Button color="inherit">Home</Button>
        </Link>
        {!session ? (
          <>
            <Button color="inherit" onClick={() => signIn()}>
              Login
            </Button>
            <Link href="/register">
              <Button color="inherit">Register</Button>
            </Link>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={handleClick}>
              {session?.user?.name}
            </Button>

            <Menu
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => signOut()}>SignOut</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  )
}
