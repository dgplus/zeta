const stateNames = {
  '01': 'Alabama',
  '02': 'Alaska',
  '04': 'Arizona',
  '05': 'Arkansas',
  '06': 'California',
  '08': 'Colorado',
  '09': 'Connecticut',
  10: 'Delaware',
  11: 'District of Columbia',
  12: 'Florida',
  13: 'Georgia',
  15: 'Hawaii',
  16: 'Idaho',
  17: 'Illinois',
  18: 'Indiana',
  19: 'Iowa',
  20: 'Kansas',
  21: 'Kentucky',
  22: 'Louisiana',
  23: 'Maine',
  24: 'Maryland',
  25: 'Massachusetts',
  26: 'Michigan',
  27: 'Minnesota',
  28: 'Mississippi',
  29: 'Missouri',
  30: 'Montana',
  31: 'Nebraska',
  32: 'Nevada',
  33: 'New Hampshire',
  34: 'New Jersey',
  35: 'New Mexico',
  36: 'New York',
  37: 'North Carolina',
  38: 'North Dakota',
  39: 'Ohio',
  40: 'Oklahoma',
  41: 'Oregon',
  42: 'Pennsylvania',
  44: 'Rhode Island',
  45: 'South Carolina',
  46: 'South Dakota',
  47: 'Tennessee',
  48: 'Texas',
  49: 'Utah',
  50: 'Vermont',
  51: 'Virginia',
  53: 'Washington',
  54: 'West Virginia',
  55: 'Wisconsin',
  56: 'Wyoming',
}

$(document).ready(function () {
  // Populate state select dropdown
  const stateSelect = $('#stateSelect')
  stateSelect.empty() // Clear existing options

  // Add states in alphabetical order
  Object.values(stateNames)
    .sort()
    .forEach((stateName) => {
      stateSelect.append(`<option value="${stateName}">${stateName}</option>`)
    })

  // Populate EV select dropdown
  const evSelect = $('#evSelect')
  evSelect.empty() // Clear existing options

  // Add default option
  evSelect.append('<option value="">Select an EV</option>')

  // Load and populate EV options
  fetch('ElectricVehicles.json')
    .then((response) => response.json())
    .then((evData) => {
      // Sort EVs by model name
      evData
        .sort((a, b) => a.model.localeCompare(b.model))
        .forEach((vehicle) => {
          if (vehicle.model === 'Ford F-150 Lightning 4WD') {
            evSelect.append(
              `<option value="${vehicle.model}" selected>${vehicle.model}</option>`
            )
          } else {
            evSelect.append(
              `<option value="${vehicle.model}">${vehicle.model}</option>`
            )
          }
        })
    })

  // Populate gas vehicle select dropdown
  const gasSelect = $('#gasSelect')
  gasSelect.empty() // Clear existing options

  // Add default option
  gasSelect.append('<option value="">Select a gas vehicle</option>')

  // Load and populate gas vehicle options
  fetch('GasVehicles.json')
    .then((response) => response.json())
    .then((gasData) => {
      // Sort gas vehicles by model name
      gasData
        .sort((a, b) => a.model.localeCompare(b.model))
        .forEach((vehicle) => {
          // Add efficiency info to the display text
          const efficiency = vehicle['efficiency(gal/100miles)']
          const displayText = `${vehicle.model} (${efficiency} gal/100mi)`
          if (vehicle.model === 'Ford F-150 2WD') {
            gasSelect.append(
              `<option value="${vehicle.model}" selected>${displayText}</option>`
            )
          } else {
            gasSelect.append(
              `<option value="${vehicle.model}">${displayText}</option>`
            )
          }
        })
    })

  // Initialize the cost chart
  initCostChart()

  // Initialize the US map
  initUSMap()

  $('#milesRange').on('input', function () {
    const value = $(this).val()
    const thumb = $(this).next('.range-value')
    const percentage = ((value - 1000) / (50000 - 1000)) * 100
    thumb.text(value / 1000 + 'k')
    thumb.css('left', percentage + '%')
  })
  $('#milesRange').trigger('input')


})


$('#stateSelect, #evSelect, #gasSelect, #milesRange').on('change', function () {
  let milesRange = $('#milesRange').val()
  calculateSavings(milesRange)
})

$('#milesRange').on('input', function () {
  let milesRange = $(this).val()
   calculateSavings(milesRange)
})

$('#vehicleClassSelect').on('change', function () {
  let vehicleClass = $(this).val()
  calculateOperatingCosts(vehicleClass)
})

let vehicleClass = $('#vehicleClassSelect').val()
calculateOperatingCosts(vehicleClass)

mapChart(stateNames)