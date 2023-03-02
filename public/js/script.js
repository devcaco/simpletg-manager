// https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
document.addEventListener('DOMContentLoaded', () => {
  console.log('project-simpletg-manager JS imported successfully!');
  console.log(document.querySelector('.toast'));

  let card = document.querySelector('.main__container--login--box--left-card');
  let icon = document.querySelector('.info__btn');
  if (icon) {
    icon.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
      icon.classList.toggle('bi-x-circle');
      icon.classList.toggle('bi-info-circle');
    });
  }
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

function confirmLogOut() {
  return false;
}

function editProfile() {
  const profileModal = document.querySelector('#usersProfileModal');

  if (profileModal) {
    const modal = new bootstrap.Modal(profileModal);
    modal.show();
  }
}

async function saveUserProfile(event) {
  event.preventDefault();
  const form = document.querySelector('#usersProfileForm');

  console.log({ form });
  const formData = new FormData(form);

  try {
    const response = await axios.post(form.action, formData);

    console.log({ response });

    window.location.href = window.location.href;
  } catch (err) {
    console.log({ THERE_WAS_AN_ERROR: err });
  }
}

function deleteCustomer(customer) {
  console.log({ customer });

  const customerDelForm = document.querySelector('#customerDeleteForm');
  const customerDelFormCustomerId = document.querySelector(
    '#customerDelFormCustomerId'
  );
  const customerDelAlert = document.querySelector('.customerDelAlert_customer');
  customerDelAlert.innerHTML = customer.split(',')[1];
  const customerDelAlertModal = document.querySelector('#customerDelAlert');
  const modal = new bootstrap.Modal(customerDelAlertModal);
  modal.show();
  customerDelForm.action = '../customers/delete/';
  customerDelFormCustomerId.value = customer.split(',')[0];
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

function checkPwdMatch(pwdField1, pwdField2) {
  const input1 = document.querySelector(`#${pwdField1}`);
  const input2 = document.querySelector(`#${pwdField2}`);

  if (input2.value !== input1.value) {
    input2.setCustomValidity('Passwords Must Match');
  } else {
    // input is valid -- reset the error message
    input2.setCustomValidity('');
  }
}
