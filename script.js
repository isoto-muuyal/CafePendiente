
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Basic validation
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    // Here you would typically send the data to your server
    console.log('Login attempt:', { email, password, remember });
    
    // For demo purposes, accept any combination and redirect to welcome page
    window.location.href = `welcome.html?email=${encodeURIComponent(email)}`;
  });
  
  // Add some visual feedback for form interactions
  const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
  
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
  });
});
