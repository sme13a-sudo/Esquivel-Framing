const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  navigation.classList.toggle('is-open', expanded);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    menu.focus();
  }
});
const dialog = document.querySelector('#photo-dialog');
let opener;
document.querySelectorAll('[data-gallery]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    opener = link;
    const photo = dialog.querySelector('img');
    photo.src = link.href;
    photo.alt = link.querySelector('img').alt;
    dialog.showModal();
  });
});
dialog?.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog?.addEventListener('close', () => opener?.focus());
document.querySelector('#estimate-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const message = `Estimate request for Esquivel Framing, LLC\n\nName: ${data.get('firstName')} ${data.get('lastName')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nProject: ${data.get('projectType')}\nLocation: ${data.get('location')}\nBudget: ${data.get('budget') || 'Not specified'}\n\n${data.get('message')}`;
  const mailto = `mailto:jaimeframing@gmail.com?subject=${encodeURIComponent('Estimate request — ' + data.get('projectType'))}&body=${encodeURIComponent(message)}`;
  const fallback = document.querySelector('#email-fallback');
  fallback.href = mailto;
  fallback.hidden = false;
  document.querySelector('#form-status').textContent = 'Your email is prepared, but has not been sent. Review and send it in your email app. If the app did not open, use the link below or call us.';
  window.location.href = mailto;
});
