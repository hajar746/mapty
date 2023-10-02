'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// WORKOUT CLASS (this is the super class for running and cycling classes)
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // minutes
  }
}

// RUNNING CLASS
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); //immedietly calculating the pace
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

/////////////////////////////////////////
// APPLICATION ARCHITECTURE
// MAIN APP CLASS
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    // getting map position
    this._getPosition();

    // listening for form submission
    form.addEventListener('submit', this._newWorkout.bind(this));

    // listening to change of input type (running/cycling) --> toggling hidden on cadence/elevation
    inputType.addEventListener('change', this._toggleElevationField);
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
    this.#map = L.map('map').setView(coords, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //   event listener to show form when you click on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // showing the form
    form.classList.remove('hidden');
    inputDistance.focus();
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
    console.log(workout);

    // render workout on map as marker
    this.renderWorkoutMarker(workout);
    // render workout on list

    // hide form and clear input fields

    // clearing form inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  renderWorkoutMarker(workout) {
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
      .setPopupContent('workout') //popup text
      .openPopup();
  }
}

// CREATING THE APP
const app = new App();
