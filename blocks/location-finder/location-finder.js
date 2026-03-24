export default async function decorate(block) {
  const rows = [...block.children];
  const title = rows[0]?.children[0]?.textContent?.trim()
    || 'Schedule a Frescopa coffee bean tasting experience';
  const label = rows[0]?.children[1]?.textContent?.trim()
    || rows[1]?.children[0]?.textContent?.trim()
    || 'Find a Location NOW';

  block.innerHTML = '';

  // Left panel
  const panel = document.createElement('div');
  panel.className = 'location-finder-panel';

  const heading = document.createElement('h2');
  heading.className = 'location-finder-title';
  heading.textContent = title;
  panel.appendChild(heading);

  const labelEl = document.createElement('p');
  labelEl.className = 'location-finder-label';
  labelEl.textContent = label;
  panel.appendChild(labelEl);

  const searchWrap = document.createElement('div');
  searchWrap.className = 'location-finder-search';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'location-finder-input';
  input.placeholder = 'Zip code';
  input.setAttribute('aria-label', label);
  input.maxLength = 10;
  searchWrap.appendChild(input);

  const searchBtn = document.createElement('button');
  searchBtn.type = 'button';
  searchBtn.className = 'location-finder-button';
  searchBtn.textContent = 'Search';
  searchWrap.appendChild(searchBtn);

  panel.appendChild(searchWrap);

  // Map placeholder
  const mapPanel = document.createElement('div');
  mapPanel.className = 'location-finder-map';
  mapPanel.setAttribute('aria-hidden', 'true');
  mapPanel.innerHTML = `
    <div class="location-finder-map-placeholder">
      <svg class="location-finder-map-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
      </svg>
      <span>Map View</span>
    </div>
  `;

  block.appendChild(panel);
  block.appendChild(mapPanel);

  // Locations popup
  const overlay = document.createElement('div');
  overlay.className = 'location-finder-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Nearby Frescopa Locations');
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="location-finder-modal">
      <button type="button" class="location-finder-modal-close" aria-label="Close">&times;</button>
      <h3 class="location-finder-modal-title">Nearby Frescopa Locations</h3>
      <p class="location-finder-modal-subtitle"></p>
      <div class="location-finder-results"></div>
      <div class="location-finder-modal-actions">
        <button type="button" class="location-finder-confirm-btn" disabled>Confirm Reservation</button>
      </div>
    </div>
  `;
  block.appendChild(overlay);

  // Confirmation popup
  const confirmation = document.createElement('div');
  confirmation.className = 'location-finder-confirmation';
  confirmation.setAttribute('role', 'dialog');
  confirmation.setAttribute('aria-modal', 'true');
  confirmation.setAttribute('aria-label', 'Reservation Confirmation');
  confirmation.hidden = true;
  confirmation.innerHTML = `
    <div class="location-finder-confirm-card">
      <div class="location-finder-confirm-icon" aria-hidden="true">&#10003;</div>
      <h3 class="location-finder-confirm-heading">Reservation Confirmed!</h3>
      <div class="location-finder-confirm-details"></div>
      <button type="button" class="location-finder-confirm-done">Done</button>
    </div>
  `;
  block.appendChild(confirmation);

  // State
  let selectedLocation = null;
  let selectedTime = null;

  function renderResults(data) {
    const resultsDiv = overlay.querySelector('.location-finder-results');
    const subtitle = overlay.querySelector('.location-finder-modal-subtitle');
    subtitle.textContent = `Showing locations near ${input.value}`;

    if (!data || !data.locations || data.locations.length === 0) {
      resultsDiv.innerHTML = '<div class="location-finder-no-results">No locations found near this ZIP code. Try a different one.</div>';
      return;
    }

    resultsDiv.innerHTML = '';
    data.locations.forEach((loc) => {
      const card = document.createElement('div');
      card.className = 'location-finder-location-card';
      card.innerHTML = `
        <div class="location-finder-location-header">
          <h4 class="location-finder-location-name">${loc.name}</h4>
          ${loc.distance ? `<span class="location-finder-location-distance">${loc.distance}</span>` : ''}
        </div>
        <p class="location-finder-location-address">${loc.address || ''}</p>
        <div class="location-finder-times"></div>
      `;

      const timesDiv = card.querySelector('.location-finder-times');
      if (loc.times && loc.times.length > 0) {
        loc.times.forEach((time) => {
          const safeId = `time-${loc.name.replace(/\s+/g, '-')}-${time.replace(/[\s:]+/g, '')}`;
          const timeOpt = document.createElement('div');
          timeOpt.className = 'location-finder-time-option';
          timeOpt.innerHTML = `
            <input type="radio" name="booking-time" id="${safeId}" value="${time}" data-location="${loc.name}" data-address="${loc.address || ''}">
            <label class="location-finder-time-label" for="${safeId}">${time}</label>
          `;
          timesDiv.appendChild(timeOpt);
        });
      }

      resultsDiv.appendChild(card);
    });

    resultsDiv.addEventListener('change', (e) => {
      if (e.target.name === 'booking-time') {
        selectedLocation = e.target.dataset.location;
        selectedTime = e.target.value;
        resultsDiv.querySelectorAll('.location-finder-location-card').forEach((c) => c.classList.remove('selected'));
        e.target.closest('.location-finder-location-card').classList.add('selected');
        overlay.querySelector('.location-finder-confirm-btn').disabled = false;
      }
    });
  }

  async function handleSearch() {
    const zip = input.value.trim();
    if (!zip) return;

    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';

    try {
      const response = await fetch(
        `https://publish-p45403-e1547974.adobeaemcloud.com/compute/coffee-tasting-booking?zip=${encodeURIComponent(zip)}`,
      );
      const data = await response.json();
      renderResults(data);
      overlay.hidden = false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch locations:', error);
      renderResults({ locations: [] });
      overlay.hidden = false;
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Search';
    }
  }

  function handleConfirm() {
    if (!selectedLocation || !selectedTime) return;
    overlay.hidden = true;
    const details = confirmation.querySelector('.location-finder-confirm-details');
    details.innerHTML = `
      <p><strong>Location:</strong> ${selectedLocation}</p>
      <p><strong>Time Slot:</strong> ${selectedTime}</p>
      <p>Your coffee tasting has been successfully booked. We look forward to seeing you!</p>
    `;
    confirmation.hidden = false;
  }

  function closeOverlay() {
    overlay.hidden = true;
    selectedLocation = null;
    selectedTime = null;
    overlay.querySelector('.location-finder-confirm-btn').disabled = true;
  }

  function closeConfirmation() {
    confirmation.hidden = true;
  }

  searchBtn.addEventListener('click', handleSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  overlay.querySelector('.location-finder-modal-close').addEventListener('click', closeOverlay);
  overlay.querySelector('.location-finder-confirm-btn').addEventListener('click', handleConfirm);
  confirmation.querySelector('.location-finder-confirm-done').addEventListener('click', closeConfirmation);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
  confirmation.addEventListener('click', (e) => { if (e.target === confirmation) closeConfirmation(); });
}
