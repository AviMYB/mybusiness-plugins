// Public native form - context gate on an invite record. Paste into Edit-Page-CSS-JS(jsCode).
// The save itself stays native; this script only decides whether the form is shown, prefills it,
// and links the answer to the invite (and optionally to the business record) at save time.
//
// Prerequisites (KB 30-customization/15-public-forms.md §2.3, §3.7):
//   - INVITE_CLASS has CLP get:{staff roles, "*"} and NOTHING else public (no find -> ids cannot be listed).
//     A public get returns every column: keep only what the page may show (date, first name, expiry).
//   - cssCode hides the form until this script decides (the skeleton's #formClosed block is hidden inline):
//       #PF20 { display: none; }
//   - The link carries ?invite=<invite objectId> - opaque, no personal data in the URL.
//
// Replace the constants. Avoid the byte sequence c-l-s-= and window-dot-open in this file (edge WAF).
(function () {
  var FORM_ID      = 'PF20';           // id of the Database form
  var INVITE_CLASS = 'FeedbackInvites';
  var INVITE_FIELD = 'InviteId';       // Pointer on the intake table -> INVITE_CLASS
  var RECORD_FIELD = '';               // optional: Pointer on the intake -> business record (e.g. 'CaseId')
  var RECORD_CLASS = '';               // optional: its class (e.g. 'Cases'); the invite must carry the id in RECORD_ON_INVITE
  var RECORD_ON_INVITE = '';           // optional: Pointer field on the invite that points at that record

  var form = $('#' + FORM_ID);
  var closed = $('#formClosed');
  var inviteId = new URLSearchParams(window.location.search).get('invite');
  var invite = null;

  function pad(n) { return String(n).padStart(2, '0'); }
  function shut() { form.hide(); closed.show(); }

  if (!inviteId) return shut();

  new Simbla.Query(INVITE_CLASS).get(inviteId).then(function (inv) {
    var expires = inv.get('ExpiresAt');
    if (expires && expires.getTime() < Date.now()) return shut();
    invite = inv;
    var d = inv.get('VisitDate');                       // example prefill of a hidden date field
    if (d) form.find('[name="VisitDate"]').val(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()));
    $('#greetName').text(inv.get('FirstName') || '');   // example greeting
    form.show();
  }, shut);

  // native save event - no hooks on Simbla/Parse objects
  $(document).on('simbla-object-before-save', '#' + FORM_ID, function (e, data) {
    data.obj.set(INVITE_FIELD, Simbla.Object.extend(INVITE_CLASS).createWithoutData(inviteId));
    if (RECORD_FIELD && invite && invite.get(RECORD_ON_INVITE))
      data.obj.set(RECORD_FIELD, Simbla.Object.extend(RECORD_CLASS).createWithoutData(invite.get(RECORD_ON_INVITE).id));
  });
})();
