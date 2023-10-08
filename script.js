'use strict';

// WORKOUT CLASS (this is the super class for running and cycling classes)
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // minutes
  }

  // description of workout -- type date --
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()] //getMonth only gets the month number
    } ${this.date.getDate()}`;
  }
}

// RUNNING CLASS
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); //immedietly calculating the pace
    this._setDescription(); //immedietly sets description of workout
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// CYCLING CLASS
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevation = elevationGain;
    this.calcSpeed(); //calculating the speed immedietly
    this._setDescription(); //immedietly sets description of workout
  }

  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteAllBtn = document.querySelector('.btn-deleteAll');

/////////////////////////////////////////
// APPLICATION ARCHITECTURE
// MAIN APP CLASS
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = []; // submitted workout forms are pushed into this array
  constructor() {
    // getting map position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

    // display delete btn
    this._addDeleteBtn();

    // listening for form submission
    form.addEventListener('submit', this._newWorkout.bind(this));

    // listening to change of input type (running/cycling) --> toggling hidden on cadence/elevation
    inputType.addEventListener('change', this._toggleElevationField);

    // move to the coordinates of workout when form is clicked
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // delete all workouts
    deleteAllBtn.addEventListener('click', this._deleteAll.bind(this));

    // // delete workout
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your location');
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    //   map from leaflet
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //   event listener to show form when you click on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // showing the form
    form.classList.toggle('hidden');
    form.classList.toggle('form--transition');
    inputDistance.focus();
  }

  _hideForm() {
    // empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.classList.toggle('hidden');
    form.classList.toggle('form--transition');
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // functions to check if form data is valid (type is number and positive)
    const validInputs = (...inputs) => {
      return inputs.every(inp => Number.isFinite(inp));
    };
    const allPositive = (...inputs) => {
      return inputs.every(inp => inp > 0);
    };

    e.preventDefault(); // stop the page from reloading

    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    // get coordinates from #mapEvent object
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    // if workout is running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      // new running workout
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout is cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      // new cycling workout
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // add new object to #workouts array
    this.#workouts.push(workout);

    // render workout on map as marker
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    // hide form and clear input fields
    this._hideForm();

    // set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          //popup options
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴'} ${workout.description}`
      ) //popup text
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">👣</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        <button class='btn-delete' data-id='${workout.id}'>🗑️</button>
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
        </div>
        <button class='btn-delete' data-id='${workout.id}'>🗑️</button>
      </li>
      `;
    }
    // inserting workout form in list
    form.insertAdjacentHTML('afterend', html);
  }

  // add delete btn
  _addDeleteBtn() {
    if (this.#workouts.length > 0) {
      deleteAllBtn.classList.remove('hidden');
    }
  }

  // delete all workouts
  _deleteAll() {
    this.#workouts = [];
    localStorage.clear();

    const allWorkouts = document.querySelectorAll('.workout');
    allWorkouts.forEach(work => work.remove());
    this.#map.eachLayer(l => l instanceof L.Marker && l.remove());
  }

  _deleteWorkout(e) {
    const button = e.target.closest('.btn-delete');
    const workoutEl = e.target.closest('.workout');
    if (!button) return;
    const workout = this.#workouts.find(work => work.id === button.dataset.id);
    const desiredWork = this.#workouts.findIndex(work => work.id === workout);

    // remove the workout
    workoutEl.style.display = 'none';
    this.#workouts.splice(desiredWork, 1);
    this._setLocalStorage();
    location.reload();
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    // finding the workout by getting its id from the dataset in html
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    // moving the map to coords of workout
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      work.type === 'running'
        ? Object.setPrototypeOf(work, Running.prototype)
        : Object.setPrototypeOf(work, Cycling.prototype);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

// CREATING THE APP
const app = new App();
