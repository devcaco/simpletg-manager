// https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
document.addEventListener('DOMContentLoaded', () => {
  console.log('project-simpletg-manager JS imported successfully!');
  console.log(document.querySelector('.toast'));
});

const toastElList = document.querySelectorAll('.toast');
const option = '';
const toastList = [...toastElList].map((toastEl) =>
  new bootstrap.Toast(toastEl, option).show()
);

function showErrors() {
  const toastElList = document.querySelectorAll('.toast');
  const option = '';
  const toastList = [...toastElList].map((toastEl) =>
    new bootstrap.Toast(toastEl, option).show()
  );
}

function check() {
  console.log('Checking Password Match');
  var input = document.getElementById('signup-password-2');
  if (input.value != document.getElementById('signup-password').value) {
    input.setCustomValidity('Passwords Must Match');
  } else {
    // input is valid -- reset the error message
    input.setCustomValidity('');
  }
}
