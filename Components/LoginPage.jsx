import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { TextField, Button, Typography, Box, Paper } from '@mui/material';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import Modal from '@mui/material/Modal';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address. (Ex. xxx@gmail.com)')
    .required('Email is required. (Hint: admin@gmail.com)'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters.')
    .required('Password is required. (Hint: admin123)'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [phoneDetails, setPhoneDetails] = useState({
    country: '',
    phoneNumber: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signUpDetails, setSignUpDetails] = useState({
    country: '',
    phoneNumber: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [verificationStatus, setVerificationStatus] = useState('');

  const countries = [
    { code: '+60', name: 'Malaysia' },
    { code: '+65', name: 'Singapore' },
  ];

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    setPhoneDetails(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'country') {
      const countryCode = countries.find(c => c.name === value)?.code || '';
      setPhoneDetails(prev => ({
        ...prev,
        phoneNumber: countryCode
      }));
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get('/api/students');
      const studentExists = response.data.some(student => 
        student.country === phoneDetails.country && 
        student.phoneNumber === phoneDetails.phoneNumber
      );

      if (studentExists) {
        setSnackbarMessage('Password reset instructions have been sent to your phone number.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setForgotPasswordOpen(false);
      } else {
        setSnackbarMessage('Unable to find this phone number in our school records.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('An error occurred. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const response = await axios.get('/api/users', {
        params: {
          email: values.email,
          password: values.password,
        },
      });

      if (response.data.length > 0) {
        localStorage.setItem('user', JSON.stringify(response.data[0]));
        setIsAnimating(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        alert('Incorrect Email or Password, please try again!');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpDetails(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'country') {
      const countryCode = countries.find(c => c.name === value)?.code || '';
      setSignUpDetails(prev => ({
        ...prev,
        phoneNumber: countryCode
      }));
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get('/api/students');
      const studentExists = response.data.some(student => 
        student.country === signUpDetails.country && 
        student.phoneNumber === signUpDetails.phoneNumber
      );

      setVerificationStatus(studentExists ? 'Verification Successfully' : 'Unable to found the phone number');
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('An error occurred. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signUpDetails.password !== signUpDetails.confirmPassword) {
      setSnackbarMessage('Passwords do not match');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Check if email exists
      const response = await axios.get('/api/users');
      const emailExists = response.data.some(user => user.email === signUpDetails.email);

      if (emailExists) {
        setSnackbarMessage('Email has already been registered');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(), // Generate a simple unique ID
        email: signUpDetails.email,
        password: signUpDetails.password,
        role: signUpDetails.role.toLowerCase() // Convert to lowercase to match existing format
      };

      await axios.post('/api/users', newUser);
      
      setSnackbarMessage('Sign up successful!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setSignUpOpen(false);
      
      // Clear the form data
      setSignUpDetails({
        country: '',
        phoneNumber: '',
        email: '',
        role: '',
        password: '',
        confirmPassword: ''
      });
      setVerificationStatus('');
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('An error occurred. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSignUpClick = () => {
    setSignUpOpen(true);
    setSignUpDetails({
      country: '',
      phoneNumber: '',
      email: '',
      role: '',
      password: '',
      confirmPassword: ''
    });
    setVerificationStatus('');
  };

  const forgotPasswordLink = (
    <Typography variant="body1" textAlign="right" sx={{ mt: 1, mb: 3 }}>
      <a 
        href="#" 
        onClick={(e) => {
          e.preventDefault();
          setForgotPasswordOpen(true);
        }}
        style={{ textDecoration: 'none', color: '#007bff' }}
      >
        Forgot Password?
      </a>
    </Typography>
  );

  const forgotPasswordModal = (
    <Modal 
      open={forgotPasswordOpen} 
      onClose={() => setForgotPasswordOpen(false)}
      sx={{ backdropFilter: 'blur(5px)' }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 6,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 6
        }}>
          <Typography variant="h4" fontWeight="bold">
            Forgot Password?
          </Typography>
          <IconButton 
            onClick={() => setForgotPasswordOpen(false)} 
            sx={{ 
              color: '#F44336',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <form onSubmit={handleForgotPassword}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
          }}>
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                name="country"
                value={phoneDetails.country}
                onChange={handlePhoneChange}
                required
              >
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.name}>
                    {country.name} ({country.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={phoneDetails.phoneNumber}
              onChange={handlePhoneChange}
              required
            />

            <Button 
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                textTransform: 'none',
                fontSize: '16px',
                padding: '15px',
                backgroundColor: '#007bff',
                ':hover': { backgroundColor: '#0056b3' }
              }}
            >
              Send SMS For Reset Password
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );

  const signUpModal = (
    <Modal 
      open={signUpOpen} 
      onClose={() => {
        setSignUpOpen(false);
        setSignUpDetails({
          country: '',
          phoneNumber: '',
          email: '',
          role: '',
          password: '',
          confirmPassword: ''
        });
        setVerificationStatus('');
      }}
      sx={{ backdropFilter: 'blur(5px)' }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 6,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Typography variant="h5" fontWeight="bold" mb={4}>
          Please Enter your phone number and country to verify
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ width: '33%' }}>
            <InputLabel>Country</InputLabel>
            <Select
              name="country"
              value={signUpDetails.country}
              onChange={handleSignUpChange}
              required
            >
              {countries.map((country) => (
                <MenuItem key={country.code} value={country.name}>
                  {country.name} ({country.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            sx={{ width: '67%' }}
            label="Phone Number"
            name="phoneNumber"
            value={signUpDetails.phoneNumber}
            onChange={handleSignUpChange}
            required
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography color={verificationStatus.includes('Successfully') ? 'success.main' : 'error.main'}>
            {verificationStatus}
          </Typography>
          <Button 
            variant="contained"
            onClick={handleVerify}
            sx={{ width: '25%' }}
          >
            Verify
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" fontWeight="bold" mb={3}>
          Sign Up for new account
        </Typography>

        <form onSubmit={handleSignUp}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              sx={{ width: '75%' }}
              label="Email"
              name="email"
              value={signUpDetails.email}
              onChange={handleSignUpChange}
              required
              disabled={!verificationStatus.includes('Successfully')}
            />
            <FormControl sx={{ width: '25%' }}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={signUpDetails.role}
                onChange={handleSignUpChange}
                required
                disabled={!verificationStatus.includes('Successfully')}
              >
                <MenuItem value="Student">Student</MenuItem>
                <MenuItem value="Teacher">Teacher</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              sx={{ width: '50%' }}
              label="Password"
              type="password"
              name="password"
              value={signUpDetails.password}
              onChange={handleSignUpChange}
              required
              disabled={!verificationStatus.includes('Successfully')}
            />
            <TextField
              sx={{ width: '50%' }}
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={signUpDetails.confirmPassword}
              onChange={handleSignUpChange}
              required
              disabled={!verificationStatus.includes('Successfully')}
            />
          </Box>

          <Button 
            type="submit"
            variant="contained"
            fullWidth
            disabled={!verificationStatus.includes('Successfully')}
            sx={{
              textTransform: 'none',
              fontSize: '16px',
              padding: '15px',
              backgroundColor: '#007bff',
              ':hover': { backgroundColor: '#0056b3' }
            }}
          >
            Sign Up
          </Button>
        </form>
      </Box>
    </Modal>
  );

  const snackbar = (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={() => setSnackbarOpen(false)} 
        severity={snackbarSeverity} 
        sx={{ width: '100%' }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>
  );

  return (
    <div>
      <div className="background"></div>
      <Box className="login-container">
        <Paper elevation={8} sx={{ padding: '50px', width: '500px', borderRadius: '15px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: '-110px', left: '50%', transform: 'translateX(-50%)', borderRadius: '50%', padding: '20px' }}>
            <img 
              src="Sushi.png" 
              alt="School Logo" 
              className={`logo-img ${isAnimating ? 'animate-logo' : ''}`}
            />
          </Box>
          <Typography variant="h4" fontWeight="bold" mb={4} sx={{ marginTop: '70px' }}>School Information System</Typography>
          <Formik initialValues={{ email: '', password: '' }} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ isSubmitting }) => (
              <Form>
                <Box mb={4}>
                  <Field name="email" as={TextField} fullWidth label="Email" variant="outlined" helperText={<ErrorMessage name="email" />} error={(msg) => !!msg} inputProps={{ style: { fontSize: '18px', padding: '12px' } }} InputLabelProps={{ style: { fontSize: '18px' } }} />
                </Box>
                <Box mb={4}>
                  <Field name="password" as={TextField} fullWidth label="Password" type="password" variant="outlined" helperText={<ErrorMessage name="password" />} error={(msg) => !!msg} inputProps={{ style: { fontSize: '18px', padding: '12px' } }} InputLabelProps={{ style: { fontSize: '18px' } }} />
                </Box>
                {forgotPasswordLink}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    onClick={handleSignUpClick}
                    sx={{ textTransform: 'none', fontSize: '18px', padding: '15px', color: '#007bff', borderColor: '#007bff' }}
                  >
                    Sign Up Now
                  </Button>
                  <Button variant="contained" fullWidth type="submit" disabled={isSubmitting} sx={{ textTransform: 'none', fontSize: '18px', padding: '15px', backgroundColor: '#007bff', ':hover': { backgroundColor: '#0056b3' } }}>Log In</Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
      {forgotPasswordModal}
      {signUpModal}
      {snackbar}
    </div>
  );
};

export default LoginPage;