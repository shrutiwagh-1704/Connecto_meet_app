import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContex';
import Snackbar from '@mui/material/Snackbar';



// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function Authentication() {
 const [username,setUsername]=React.useState("");
 
 const [password,setPassword]=React.useState("");
 const [name,setName]=React.useState("");
 const [error,setError]=React.useState();
 const [message,setMessage]=React.useState();
 const [formState,setFormState]=React.useState(0);
 const [open,setOpen]=React.useState(false);
 const {handleRegister,handleLogin} = React.useContext(AuthContext);

 React.useEffect(() => {
  setName("");
  setUsername("");
  setPassword("");
  setError("");
}, [formState]);

 let handleAuth=async()=>{
  try{
    if(formState==0)
    {
      let result = await handleLogin(username,password);
      console.log(result);
      setUsername("");
      setError("");
      setPassword("")
      setMessage(result);
      setFormState(0);

      setOpen(true);

    }
    if(formState==1)
    {
      let result = await handleRegister(name,username,password);
      console.log(result);
      setName("");
      setUsername("");
      setError("");
      setPassword("")
      setMessage(result);
      setOpen(true);

    }
  }
  catch(err)
  {
    let message=(err.response.data.message);
    setError(message);
  }
 }

return (
  <ThemeProvider theme={defaultTheme}>
    <Grid container sx={{ height: '100vh' }}>
      <CssBaseline />

      {/* Left side with image */}
      <Grid
        size={{ xs: 0, sm: 4, md: 7 }}
        sx={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHZpZGVvY2FsbHxlbnwwfHwwfHx8MA%3D%3D")',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Right side form */}
      <Grid size={{ xs: 12, sm: 8, md: 5 }} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>

          <div>
            <Button variant={formState=== 0 ? "contained":" "} onClick={()=>{setFormState(0)}}>
              Sign in
            </Button>
            <Button variant={formState=== 1 ? "contained":" "} onClick={()=>{setFormState(1)}}>
              Sign up
            </Button>
          </div>
         

          <Box component="form" noValidate sx={{ mt: 1 }}>
            {formState===1 ? 
            <TextField 
              margin="normal"
              required 
              fullWidth 
              label="name" 
              value={name ?? ""}
              autoFocus 
              onChange={(e)=>setName(e.target.value)}/>
              :<></>}

            
            <TextField 
              margin="normal"
              required 
              fullWidth 
              label="Username"
              value={username ?? ""} 
              autoFocus 
              onChange={(e)=>setUsername(e.target.value)}/>

            <TextField 
              margin="normal" 
              required 
              fullWidth 
              label="Password" 
              type="password"
              value={password ?? ""}

              onChange={(e)=>setPassword(e.target.value)} 
            />

            <p style={{color:"red"}}>{error}</p>

            <Button 
            type='button'
            fullWidth 
            variant="contained" 
            sx={{ mt: 3, mb: 2 }}
            onClick={handleAuth}>
            {formState == 0 ? "Login":"Register"}
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>

    <Snackbar
      open={open}
      autoHideDuration={4000}
      message={message}
    />
  </ThemeProvider>
);

}