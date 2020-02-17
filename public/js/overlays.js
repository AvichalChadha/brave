//
// This web interface has been quickly thrown together. It's not production code.
//

overlaysHandler = {};
overlaysHandler.items = [];

overlaysHandler.findById = function (id) {
  return overlaysHandler.items.find(function(x) { return x.id == id })
};

overlaysHandler.draw = function () {
  overlaysHandler._drawCards()
};

overlaysHandler.showFormToAdd = function () {
  overlaysHandler._showForm({})
};

overlaysHandler.showFormToEdit = function ( overlay ) {
  overlaysHandler._showForm( overlay )
};

overlaysHandler._drawCards = () => {
  $('#cards').append( overlaysHandler.items.map( overlaysHandler._asCard ) );
};

overlaysHandler._asCard = (overlay) => {
  return components.card({
    title: `Overlay ${overlay.id} (${prettyType(overlay.type)})`,
    options: overlaysHandler._optionButtonsForOverlay(overlay),
    body: overlaysHandler._overlayCardBody(overlay),
    mixOptions: overlaysHandler._getMixOptions(overlay)
  })
};

overlaysHandler._optionButtonsForOverlay  = (overlay) => {
  const editButton   = components.editButton().click(() => { overlaysHandler.showFormToEdit(overlay); return false });
  const deleteButton = components.deleteButton().click(() => { overlaysHandler.delete(overlay); return false });
  return [editButton, deleteButton]
};

overlaysHandler._overlayCardBody = (overlay) => {
  const details = [];
  if (overlay.effect_name) details.push(`<strong>Effect:</strong> ${overlay.effect_name}`);
  if (overlay.text) details.push(`<strong>Text:</strong> ${overlay.text}`);
  if (overlay.font_size) details.push(`<strong>Font Size:</strong> ${overlay.font_size}`);
  if (overlay.valignment) details.push(`<strong>Vertical alignment:</strong> ${overlay.valignment}`);
  if (overlay.halignment) details.push(`<strong>Horizontal alignment:</strong> ${overlay.halignment}`);
  if (overlay.outline) details.push(`<strong>Outline:</strong> ${overlay.outline}`);
  if (overlay.shadow) details.push(`<strong>Shadow:</strong> ${overlay.shadow}`);
  if (overlay.shaded_background) details.push(`<strong>Background:</strong> ${overlay.shaded_background}`);
  return details.map(d => $('<div></div>').append(d))
};

overlaysHandler.overlay = (overlay) => {
  submitCreateOrEdit('overlay', overlay.id, {visible: true})
};

overlaysHandler.remove = (overlay) => {
  submitCreateOrEdit('overlay', overlay.id, {visible: false})
};

overlaysHandler._getMixOptions = (overlay) => {
  const div = $('<div class="mix-option"></div>');
  if (!overlay.source) {
    div.addClass('mix-option-not-connected');
    return div.append('Not connected')
  }

  let showingOrHidden;
  if (overlay.visible) {
    showingOrHidden = 'In mix';
    div.addClass('mix-option-showing');
    const removeButton = components.removeButton();
    removeButton.click(() => { overlaysHandler.remove(overlay); return false });
    const buttons = $('<div class="option-icons"></div>').append(removeButton);
    div.append(buttons)
  }
  else {
    showingOrHidden = 'Not in mix';
    div.addClass('mix-option-hidden');
    const overlayButton = components.overlayButton();
    overlayButton.click(() => { overlaysHandler.overlay(overlay); return false });
    const buttons = $('<div class="option-icons"></div>').append(overlayButton);
    div.append(buttons)
  }
  div.append('<strong>' + prettyUid(overlay.source) + ':</strong> ' + showingOrHidden);
  return div
};

overlaysHandler.delete = function(overlay) {
  $.ajax({
    contentType: "application/json",
    type: 'DELETE',
    url: 'api/overlays/' + overlay.id,
    dataType: 'json',
    success: function() {
      showMessage('Successfully deleted overlay ' + overlay.id , 'success' );
      updatePage()
    },
    error: function(response) {
      showMessage(response.responseJSON && response.responseJSON.error ?
        'Error deleting overlay: ' + response.responseJSON.error : 'Error deleting overlay', 'danger' );
    }
  });
};

overlaysHandler._handleNewFormType = function(event) {
  overlaysHandler._populateForm({type: event.target.value})
};

overlaysHandler._showForm = function(overlay) {
  overlaysHandler.currentForm = $('<form></form>');
  const label = overlay && overlay.hasOwnProperty('id') ? 'Edit overlay ' + overlay.id : 'Add overlay';
  showModal(label, overlaysHandler.currentForm, overlaysHandler._handleFormSubmit);
  overlaysHandler._populateForm(overlay)
};



overlaysHandler._populateForm = function(overlay) {
  const form = overlaysHandler.currentForm;
  form.empty();

  const overlayTypes = options => formGroup({
    id: 'overlay-type',
    label: 'Type',
    name: 'type',
    initialOption: 'Select a type...',
    options,
    value: overlay.type
  });

  const overlayText = formGroup({
    id: 'overlay-text',
    label: 'Text',
    name: 'text',
    value: overlay.text || '',
    help: 'The text to be shown by this overlay'
  });

  const fontsize = formGroup({
    id: 'input-fontsize',
    label: 'Font Size',
    name: 'font_size',
    type: 'number',
    value: overlay.font_size,
    help: 'Size of overlay text',
  });

  const valignment = formGroup({
    id: 'overlay-valignment',
    label: 'Vertical alignment',
    name: 'valignment',
    initialOption: 'Select an alignment...',
    options: overlaysHandler.valignmentTypes,
    value: overlay && overlay.valignment ? overlay.valignment : 'bottom'
  });

  const halignment = formGroup({
    id: 'overlay-halignment',
    label: 'Horizontal alignment',
    name: 'halignment',
    initialOption: 'Select an alignment...',
    options: overlaysHandler.halignmentTypes,
    value: overlay && overlay.halignment ? overlay.halignment : 'left'
  });

  const textOutline = formGroup({
    id: 'input-text-bg',
    type: 'checkbox',
    name: 'outline',
    label: 'Add a outline to text overlay',
    value: overlay.outline,
  });

  const textShadow = formGroup({
    id: 'input-text-bg',
    type: 'checkbox',
    name: 'shadow',
    label: 'Add a shadow to text overlay',
    value: overlay.shadow,
  });

  const shadedBackground = formGroup({
    id: 'input-text-bg',
    type: 'checkbox',
    name: 'shaded_background',
    label: 'Add a background to text overlay',
    value: overlay.shaded_background,
  });

  const effectName = formGroup({
    id: 'overlay-effect',
    label: 'Effect',
    name: 'effect_name',
    initialOption: 'Select an effect...',
    options: overlaysHandler.effectNames,
    value: overlay ? overlay.effect_name : undefined
  });

  const isNew = !overlay.hasOwnProperty('id');
  if (isNew) {
    options = {
      text: 'Text',
      clock: 'Clock',
      effect: 'Effect'
    };
    form.append( overlayTypes( options ) );
  }
  else {
    form.append(`<input type="hidden" name="id" value="${overlay.id}">`)
  }

  form.append(getSourceSelect(overlay, isNew));
  if (!overlay.type) {
  }

  else if ( overlay.type === 'text' || overlay.type === 'clock' ) {
    form.append(overlayText);
    form.append(fontsize);
    form.append(valignment);
    form.append(halignment);
    form.append(textOutline);
    form.append(textShadow);
    form.append(shadedBackground);
  }

  else if (overlay.type === 'effect') {
    form.append(effectName);
  }

  form.find('select[name="type"]').change(overlaysHandler._handleNewFormType);
};

overlaysHandler._handleNewFormType = function ( event ) {
  overlaysHandler._showForm({type: event.target.value})
};

overlaysHandler._handleFormSubmit = function () {
  const form = overlaysHandler.currentForm;
  const idField = form.find('input[name="id"]');
  const id = idField.length ? idField.val() : null;
  const overlay = (id != null) ? overlaysHandler.findById(id) : {};
  const newProps = {};

  const fields = [
    'type',
    'text',
    'font_size',
    'valignment',
    'halignment',
    'outline',
    'shadow',
    'shaded_background',
    'effect_name',
    'source',
  ];
  fields.forEach(f => {
    let overlay = form.find( `[name="${f}"]` );
    if ( overlay && overlay.val() != null ) {
      newProps[f] = overlay.val()
    }
  });

  const type = newProps.type || overlay.type;

  if ( !type ) {
    showMessage('Please select a type', 'info' );
    return;
  }

  if ( ( type === 'text' || type === 'clock' ) && !newProps.valignment && !newProps.halignment ) {
    showMessage('Please select a vertical alignment', 'info' );
    return;
  }

  if ( ( type === 'effect' ) && !newProps.effect_name ) {
    showMessage('Please select an effect', 'info' );
    return;
  }

  if ( !Object.keys( newProps ).length ) {
    showMessage('No new values', 'info' );
    return;
  }

  const outline = form.find('[name="outline"]');
  if ( outline && outline.length > 0 ) newProps.outline = outline.is( ':checked' );

  const shadow = form.find('[name="shadow"]');
  if (shadow && shadow.length > 0) newProps.shadow = shadow.is( ':checked' );

  const shaded_background = form.find('[name="shaded_background"]');
  if (shaded_background && shaded_background.length > 0) newProps.shaded_background = shaded_background.is( ':checked' );

  if ( newProps.source === 'none' ) newProps.source = null;
  submitCreateOrEdit('overlay', id, newProps);
  hideModal();
};

overlaysHandler.valignmentTypes = {
  top: 'Top',
  center: 'Center',
  bottom: 'Bottom',
  baseline: 'Baseline'
};

overlaysHandler.halignmentTypes = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
};

overlaysHandler.effectNames = {
  'agingtv': 'AgingTV (adds age to video input using scratches and dust)',
  'burn': 'Burn (adjusts the colors in the video)',
  'chromium': 'Chromium (breaks the colors of the video)',
  'dicetv': 'DiceTV (\'Dices\' the screen up into many small squares)',
  'dilate': 'Dilate (copies the brightest pixel around)',
  'dodge': 'Dodge (saturates the colors in the video)',
  'edgetv': 'EdgeTV effect',
  'exclusion': 'Exclusion (excludes the colors in the video)',
  'optv': 'OpTV (Optical art meets real-time video)',
  'radioactv': 'RadioacTV (motion-enlightenment)',
  'revtv': 'RevTV (A video waveform monitor for each line of video)',
  'rippletv': 'RippleTV (ripple mark effect on the video)',
  'solarize': 'Solarize (tunable inverse in the video)',
  'streaktv': 'StreakTV (makes after images of moving objects)',
  'vertigotv': 'VertigoTV (blending effector with rotating and scaling)',
  'warptv': 'WarpTV (goo\'ing of the video)',
};
