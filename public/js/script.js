// https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
document.addEventListener('DOMContentLoaded', () => {
  console.log('project-simpletg-manager JS imported successfully!');
  console.log(document.querySelector('.toast'));
});

function deleteUser(user) {
  console.log({ user });

  const userDelForm = document.querySelector('#userDeleteForm');
  const userDelFormUserId = document.querySelector('#userDelFormUserId');
  const userDelAlert = document.querySelector('.userDelAlert_username');
  userDelAlert.innerHTML = user.split(',')[1];
  const userDelAlertModal = document.querySelector('#userDelAlert');
  const modal = new bootstrap.Modal(userDelAlertModal);
  modal.show();
  userDelForm.action = '../users/delete/';
  userDelFormUserId.value = user.split(',')[0];
}

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

function resetUserPwd(user) {
  const userResetPwdModal = document.querySelector('#usersPwdModal');
  const userResetPwdForm = document.querySelector('#usersPwdForm');
  const userPwdUsername = document.querySelector('#pwdUsernameField');
  const userIdField = document.querySelector('#userPwdIdField');
  const modal = new bootstrap.Modal(userResetPwdModal);
  modal.show();
  userIdField.value = user.split(',')[0];
  userPwdUsername.value = user.split(',')[1];
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
