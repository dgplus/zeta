function initUSMap() {
  const width = $('#us-map').width()
  const height = 500
  // Create SVG container first
  const svg = d3
    .select('#us-map')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', '100%')
  const g = svg.append('g')

  // Check if stateChart has data, otherwise load from StateResults.json
  if (stateChart && stateChart.length > 0) {
    renderMap(stateChart);
  } else {
    // Load data from StateResults.json as fallback
    d3.json('StateResults.json').then((data) => {
      data.forEach((state) => {
        stateChart.push(state);
      });
      renderMap(stateChart);
    });
  }

  function renderMap(data) {
    // Process the data
    const stateData = {};
    data.forEach((state) => {
      stateData[state.state] = state;
    });

    // Process the values for each state
    Object.values(stateNames).forEach((name) => {
      const state = stateData[name];
      if (state) {
        // For data from StateResults.json format
        if (typeof state['cost/100miles(ev)'] === 'string') {
          // Parse values from the JSON format (removing $ and commas)
          const evCost = parseFloat(
            state['cost/100miles(ev)'].replace('$', '').replace(',', '')
          );
          const gasCost = parseFloat(
            state['cost/100miles(gas)'].replace('$', '').replace(',', '')
          );
          const evAnnual = parseFloat(
            state['totalannualcost(ev)'].replace('$', '').replace(',', '')
          );
          const gasAnnual = parseFloat(
            state['totalannualcost(gas)'].replace('$', '').replace(',', '')
          );
          const savings = parseFloat(
            state['annualsavings$(ev)'].replace('$', '').replace(',', '')
          );

          stateData[name] = {
            evCost: evCost,
            gasCost: gasCost,
            evAnnual: evAnnual,
            gasAnnual: gasAnnual,
            savings: savings,
          };
        } 
        // For data from mapChart calculation format
        else {
          stateData[name] = {
            evCost: state['cost/100miles(ev)'],
            gasCost: state['cost/100miles(gas)'],
            evAnnual: state['totalannualcost(ev)'],
            gasAnnual: state['totalannualcost(gas)'],
            savings: state['annualsavings$(ev)'],
          };
        }
      }
    });

    // Load and process the map data
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(
      (topology) => {
        const states = topojson.feature(topology, topology.objects.states);
        const projection = d3.geoAlbersUsa().fitSize([width, height], states);
        const path = d3.geoPath().projection(projection);
        
        g.selectAll('path.state')
          .data(states.features)
          .enter()
          .append('path')
          .attr('class', 'state')
          .attr('d', path)
          .attr('fill', function (d) {
            // Get the state name from the ID
            const stateName = stateNames[d.id];
            const data = stateData[stateName]; 
            const value = data?.savings/12
            
            if (value >= 51 && value <= 75) {
              return '#FEF097';
            } else if (value >= 76 && value <= 100) {
              return '#FEF097';
            } else if (value >= 101 && value <= 125) {
              return '#B3C781';
            } else if (value >= 126 && value <= 150) {
              return '#B3C781';
            } else if (value >= 151 && value <= 175) {
              return '#689F6B';
            } else if (value >= 176 && value <= 200) {
              return '#689F6B';
            } else if (value >= 201 && value <= 225) {
              return '#477662';
            } else if (value >= 226) {
              return '#477662';
            } else {
              return '#477662'; // Default color for values below 51
            }
            
          })
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', function (event, d) {
            //d3.select(this).attr('fill', '#1EC77675');
          })
          .on('mouseleave', function (event, d) {
            // Get the state name from the ID
            const stateName = stateNames[d.id];

            
          })
          .on('click', function (event, d) {
            showPopover(event, d, stateData);
          });

        // Hide popover on click outside
        $('.map-container').on('click', function (e) {
          if (!$(e.target).is('path.state')) {
            $('#state-popover').hide();
          }
        });
      }
    );
  }

  function showPopover(event, d, stateData) {
    const stateName = stateNames[d.id];
    const data = stateData[stateName];
    if (data) {
      const popover = $('#state-popover');
      popover.find('.state-name').text(stateName);
      popover.find('.ev-cost').text('$' + data.evCost.toFixed(2));
      popover.find('.gas-cost').text('$' + data.gasCost.toFixed(2));
      popover.find('.ev-annual').text('$' + data.evAnnual.toFixed(2).toLocaleString());
      popover
        .find('.gas-annual')
        .text('$' + data.gasAnnual.toFixed(2).toLocaleString());
      popover.find('.savings').text('$' + data.savings.toFixed(2).toLocaleString());
      
      // Position popover above mouse
      const mapContainer = $('.map-container')[0].getBoundingClientRect();
      const left =
        event.clientX - mapContainer.left - popover.outerWidth() / 2;
      const top =
        event.clientY - mapContainer.top - popover.outerHeight() - 10;
      popover.css({
        display: 'block',
        left: left + 'px',
        top: top + 'px',
      });
    }
  }
}

function initCostChart() {
  // Chart configuration
  const ctx = document.getElementById('costChart').getContext('2d')
  const costChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: 12}, (_, i) => `${i+1}`),
      datasets: [
        {
          label: 'Gas Vehicle',
          data: [],  // Will be populated with real data
          borderColor: '#EBEBEC',
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          fill: true,
          tension: 0.5,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
        {
          label: 'Electric Vehicle',
          data: [], // Will be populated with real data
          borderColor: 'yellow',
          backgroundColor: 'rgba(246, 217, 250, 0.07)',
          fill: true,
          tension: 0.5,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 15,
              family: 'Open Sans',
              weight: 600,
            },
            color: '#EBEBEC',
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              if (context.parsed.y !== null) {
                label += '$' + context.parsed.y.toLocaleString()
              }
              return label
            },
          },
          backgroundColor: '#fff',
          titleColor: '#000',
          bodyColor: '#000',
          borderColor: '#eee',
          borderWidth: 1,
          titleFont: { weight: 'bold' },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Years',
            font: {
              family: 'Open Sans',
              size: 14,
              weight: 600
            },
            color: '#516381'
          },
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: '#b0b0b0',
            font: {
              family: 'Open Sans',
              size: 13,
            },
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Cumulative Cost ($)',
            font: {
              family: 'Open Sans',
              size: 14, 
              weight: 600
            },
            color: '#516381'
          },
          grid: {
            color: 'transparent',
            drawBorder: false,
          },
          ticks: {
            color: '#b0b0b0',
            font: {
              family: 'Open Sans',
              size: 13,
            },
            callback: function (value) {
              return '$' + value.toLocaleString()
            },
          },
        },
      },
    },
  })

  // Store chart instance globally so we can update it
  window.costChart = costChart;
}


async function calculateSavings(milesRange) {

  let state = jQuery('#stateSelect').val()
  let costPerKwh = 0
  let evEfficiency = 0
  let evCostPer100Miles = 0
  let ev = $('#evSelect').val() || 'Ford F-150 Lightning 4WD'
  let gas = $('#gasSelect').val() || 'Ford F-150 2WD'
  let costPerGallon = 0
  let gasEfficiency = 0
  let gasCostPer100Miles = 0
  


  $('.ev-model-name').text(ev)
  $('.gas-model-name').text(gas)
  $('.gas-cost-per-kwh').text('N/A')

  //load values from json file    

  const electricityPrices = d3.json('ElectricityPricesEIA.json')
  const gasPrices = d3.json('GasPricesAAA.json')

  electricityPrices.then((data) => {
    costPerKwh = data.find((d) => d.state === state).price
    if (costPerKwh === null || costPerKwh === 0 || costPerKwh === undefined) {
      $('.ev-cost-per-kwh').text('N/A')
    } else {
      $('.ev-cost-per-kwh').text('$' + (costPerKwh / 100).toFixed(2))
    }
    $('.ev-cost-per-gallon').text('N/A')
    const electricVehicles = d3.json('ElectricVehicles.json')
    electricVehicles.then((data) => {
      evEfficiency = data.find((d) => d.model === ev)['kwh/100miles']
      $('.ev-efficiency').text(evEfficiency)
      evCostPer100Miles = (costPerKwh * evEfficiency) / 100
      $('.ev-cost-per-100-miles').text('$' + evCostPer100Miles.toFixed(2))

      gasPrices.then((data) => {
        costPerGallon = data.find((d) => d.state === state).price
        if (
          costPerGallon === null ||
          costPerGallon === 0 ||
          costPerGallon === undefined
        ) {
          $('.gas-cost-per-gallon').text('N/A')
        } else {
          $('.gas-cost-per-gallon').text('$' + costPerGallon)
        }
        const gasVehicles = d3.json('GasVehicles.json')
        gasVehicles.then((data) => {
          gasEfficiency = data.find((d) => d.model === gas)[
            'efficiency(gal/100miles)'
          ]
          $('.gas-efficiency').text(gasEfficiency)
    
          console.log(costPerGallon, gasEfficiency)
    
          gasCostPer100Miles = costPerGallon * gasEfficiency
          $('.gas-cost-per-100-miles').text('$' + gasCostPer100Miles.toFixed(2))
    
          // Calculate total cost per mile
          let evTotalCostPerMile = evCostPer100Miles / 100
          let gasTotalCostPerMile = gasCostPer100Miles / 100
    
          $('.ev-total-cost-per-mile').text('$' + evTotalCostPerMile.toFixed(2))
          $('.gas-total-cost-per-mile').text('$' + gasTotalCostPerMile.toFixed(2))
          // Calculate total annual costs
          let evTotalAnnualCost = evTotalCostPerMile * milesRange
          let gasTotalAnnualCost = gasTotalCostPerMile * milesRange
    
          $('.ev-total-annual-cost').text('$' + (evTotalAnnualCost.toFixed(2)).toLocaleString())
          $('.gas-total-annual-cost').text('$' + (gasTotalAnnualCost.toFixed(2)).toLocaleString())
    
          // Calculate monthly costs
          let evMonthlyCost = evTotalAnnualCost / 12
          let gasMonthlyCost = gasTotalAnnualCost / 12
          
          // Create arrays for cumulative monthly costs
          let evCumulativeCosts = Array.from({length: 12}, (_, i) => evMonthlyCost * (i + 1))
          let gasCumulativeCosts = Array.from({length: 12}, (_, i) => gasMonthlyCost * (i + 1))
          
          // Update chart data
          if (window.costChart) {
            window.costChart.data.datasets[0].data = gasCumulativeCosts
            window.costChart.data.datasets[0].label = gas
            window.costChart.data.datasets[1].data = evCumulativeCosts
            window.costChart.data.datasets[1].label = ev
            window.costChart.update()
          }
    
          // Calculate annual savings
          let evAnnualSavings = 0
          let gasAnnualSavings = 0
    
          if (gasTotalAnnualCost - evTotalAnnualCost > 0) {
            evAnnualSavings = gasTotalAnnualCost - evTotalAnnualCost
    
            // apply comma separation 
            $('.ev-annual-savings').text('$' + (evAnnualSavings.toFixed(2)).toLocaleString())
    
    
          } else {
            $('.ev-annual-savings').text('No Savings')
          }
    
          if (evTotalAnnualCost - gasTotalAnnualCost > 0) {
            gasAnnualSavings = evTotalAnnualCost - gasTotalAnnualCost
            $('.gas-annual-savings').text('$' + (gasAnnualSavings.toFixed(2)).toLocaleString())
          } else {
            $('.gas-annual-savings').text('No Savings')
          }
    
          // Calculate savings percentages
          if (evAnnualSavings > 0) {
            let evAnnualSavingsPercentage =
              (evAnnualSavings / gasTotalAnnualCost) * 100
            $('.ev-annual-savings-percentage').text(
              evAnnualSavingsPercentage.toFixed(2) + '%'
            )
          } else {
            $('.ev-annual-savings-percentage').text('No Savings')
          }
    
          if (gasAnnualSavings > 0) {
            let gasAnnualSavingsPercentage =
              (gasAnnualSavings / evTotalAnnualCost) * 100
            $('.gas-annual-savings-percentage').text(
              gasAnnualSavingsPercentage.toFixed(2) + '%'
            )
          } else {
            $('.gas-annual-savings-percentage').text('No Savings')
          }
    
          // Calculate monthly savings
          let evMonthlySavings = evAnnualSavings / 12

          let gasMonthlySavings = gasAnnualSavings / 12
    
          $('.ev-monthly-savings').text('$' + evMonthlySavings.toFixed(2))
          $('.savings-year-text').text('$' + (evMonthlySavings*12).toFixed(2)+' per year')
          $('.savings-mile-text').text('$' + (gasTotalCostPerMile-evTotalCostPerMile).toFixed(2)+' per mile')

          // if the gas-monthly-savings is greater than 0 then show the gas-monthly-savings-percentage
          if (gasMonthlySavings > 0) {
            $('.gas-monthly-savings').text('$' + gasMonthlySavings.toFixed(2))
          } else {
            $('.gas-monthly-savings').text('No Savings')
          }
        })

        mapChart(stateNames)
        
      })

    })
    
  })
}


async function calculateOperatingCosts(vehicleClass) {
  let annualMiles = 15000

  let state = 'National'
  let stateEVAverage = '16.940'
  let stateGASAverage = '3.09'
  let evTotalAnnualCost = 0
  let gasTotalAnnualCost = 0
  let evCostPer100Miles = 0
  let gasCostPer100Miles = 0

  jQuery('.operating-costs-card-text1').text(
    vehicleClass + ' Average Operating Costs'
  )
  if(vehicleClass === 'Mid-Size Sedan') {
    $('.vehicle.v1').removeClass('hidden')
    $('.vehicle.v2').addClass('hidden')
    $('.vehicle.v3').addClass('hidden')
  } else if(vehicleClass === 'Full-Size Pickup') {
    $('.vehicle.v1').addClass('hidden')
    $('.vehicle.v2').removeClass('hidden')
    $('.vehicle.v3').addClass('hidden')
  } else if(vehicleClass === 'Full-Size SUV') {
    $('.vehicle.v1').addClass('hidden')
    $('.vehicle.v2').addClass('hidden')
    $('.vehicle.v3').removeClass('hidden')
  }

  $('.ev-operating-cost-per-kwh').text(
    '$' + (parseFloat(stateEVAverage) / 100).toFixed(2)
  )
  $('.gas-operating-cost-per-kwh').text('N/A')

  $('.ev-operating-cost-per-gallon').text('N/A')
  $('.gas-operating-cost-per-gallon').text(
    '$' + parseFloat(stateGASAverage).toFixed(2)
  )

  // find using class the object in the electricVehicles.json file that has the vehicleClass that matches the vehicleClassSelect value
  const electricVehicles = d3.json('ElectricVehicles.json')
  const gasVehicles = d3.json('GasVehicles.json')

  electricVehicles.then((data) => {
    //loop through the data and find the object that has the vehicleClass that matches the vehicleClassSelect value
    data.forEach((d) => {
      if (d.class === vehicleClass) {
        jQuery('.ev-operating-model-name').text(d.model)
        // kwh/100miles
        let evEfficiency = d['kwh/100miles']
        jQuery('.ev-operating-efficiency').text(evEfficiency)

        evCostPer100Miles = (parseFloat(evEfficiency) * stateEVAverage) / 100
        jQuery('.ev-operating-cost-per-100-miles').text(
          '$' + evCostPer100Miles.toFixed(2)
        )
        jQuery('.ev-operating-total-cost-per-mile').text(
          '$' + (evCostPer100Miles / 100).toFixed(2)
        )

        evTotalAnnualCost = (evCostPer100Miles / 100) * annualMiles
        jQuery('.ev-operating-total-annual-cost').text(
          '$' + evTotalAnnualCost.toFixed(2)
        )

        gasVehicles.then((data) => {
          data.forEach((d) => {
            if (d.class === vehicleClass) {
              
              jQuery('.gas-operating-model-name').text(d.model)
              // efficiency(gal/100miles)
              let gasEfficiency = d['efficiency(gal/100miles)']
              jQuery('.gas-operating-efficiency').text(gasEfficiency)

              // gas-operating-cost-per-100-miles
              gasCostPer100Miles = parseFloat(gasEfficiency) * stateGASAverage
              jQuery('.gas-operating-cost-per-100-miles').text(
                '$' + gasCostPer100Miles.toFixed(2)
              )
              jQuery('.gas-operating-total-cost-per-mile').text(
                '$' + (gasCostPer100Miles / 100).toFixed(2)
              )

              gasTotalAnnualCost = (gasCostPer100Miles / 100) * annualMiles
              jQuery('.gas-operating-total-annual-cost').text(
                '$' + gasTotalAnnualCost.toFixed(2)
              )

              // comparison of ev and gas
              let evAnnualSavings = gasTotalAnnualCost - evTotalAnnualCost

              //if((gasTotalAnnualCost-evTotalAnnualCost)>0,(gasTotalAnnualCost-evTotalAnnualCost),"No Savings")
              if (evAnnualSavings > 0) {
                jQuery('.ev-operating-annual-savings').text(
                  '$' + evAnnualSavings.toFixed(2)
                )
              } else {
                jQuery('.ev-operating-annual-savings').text('No Savings')
              }

              let gasAnnualSavings = evTotalAnnualCost - gasTotalAnnualCost
              if (gasAnnualSavings > 0) {
                jQuery('.gas-operating-annual-savings').text(
                  '$' + gasAnnualSavings.toFixed(2)
                )
              } else {
                jQuery('.gas-operating-annual-savings').text('No Savings')
              }

              // ev-operating-annual-savings-percentage
              let evAnnualSavingsPercentage =
                ((gasTotalAnnualCost - evTotalAnnualCost) /
                  gasTotalAnnualCost) *
                100

              if (evAnnualSavingsPercentage > 0) {
                jQuery('.ev-operating-annual-savings-percentage').text(
                  evAnnualSavingsPercentage.toFixed(2) + '%'
                )
              } else {
                jQuery('.ev-operating-annual-savings-percentage').text(
                  'No Savings'
                )
              }

              let gasAnnualSavingsPercentage =
                ((evTotalAnnualCost - gasTotalAnnualCost) / evTotalAnnualCost) *
                100
              if (gasAnnualSavingsPercentage > 0) {
                jQuery('.gas-operating-annual-savings-percentage').text(
                  gasAnnualSavingsPercentage.toFixed(2) + '%'
                )
              } else {
                jQuery('.gas-operating-annual-savings-percentage').text(
                  'No Savings'
                )
              }

              //ev-operating-monthly-savings
              let evMonthlySavings = evAnnualSavings / 12
              if (evMonthlySavings > 0) {
                jQuery('.ev-operating-monthly-savings').text(
                  '$' + evMonthlySavings.toFixed(2)
                )
              } else {
                jQuery('.ev-operating-monthly-savings').text('No Savings')
              }

              let gasMonthlySavings = gasAnnualSavings / 12
              if (gasMonthlySavings > 0) {
                jQuery('.gas-operating-monthly-savings').text(
                  '$' + gasMonthlySavings.toFixed(2)
                )
              } else {
                jQuery('.gas-operating-monthly-savings').text('No Savings')
              }

              // remove $ sign and convert to number
              evCostPerMile = parseFloat(
                $('.ev-operating-total-cost-per-mile').text().replace('$', '')
              )
              gasCostPerMile = parseFloat(
                $('.gas-operating-total-cost-per-mile').text().replace('$', '')
              )

              // Update the text values
              $('.operating-costs-bar-value:eq(0)').text(
                $('.gas-operating-total-cost-per-mile').text()
              )
              $('.operating-costs-bar-value:eq(1)').text(
                $('.ev-operating-total-cost-per-mile').text()
              )

              // Update the car model names in the labels
              $('.operating-costs-bar-label:eq(0)').text(
                $('.gas-operating-model-name').text()
              )
              $('.operating-costs-bar-label:eq(1)').text(
                $('.ev-operating-model-name').text()
              )

              // Update the bar heights based on the values
              // Determine the max value for scaling
              let maxCost = Math.max(evCostPerMile, gasCostPerMile)
              let barHeightScale = 150 / maxCost // Assuming 150px as max height

              // Set the heights proportionally
              $('.operating-costs-bar-rect.honda').css(
                'height',
                gasCostPerMile * barHeightScale + 'px'
              )
              $('.operating-costs-bar-rect.tesla').css(
                'height',
                evCostPerMile * barHeightScale + 'px'
              )
            }
          })
        })
      }
    })
  })

  // find using class the object in the gasVehicles.json file that has the vehicleClass that matches the vehicleClassSelect value
}

let stateChart = []

async function mapChart(states) {
  // Clear the stateChart array before updating
  stateChart = [];

  let ev = $('#evSelect').val() || 'Ford F-150 Lightning 4WD';
  let gas = $('#gasSelect').val() || 'Ford F-150 2WD';
  let milesRange = $('#milesRange').val() || 14000;

  // Load all necessary data first
  try {
    const [electricityData, evData, gasPriceData, gasVehicleData] = await Promise.all([
      d3.json('ElectricityPricesEIA.json'),
      d3.json('ElectricVehicles.json'),
      d3.json('GasPricesAAA.json'),
      d3.json('GasVehicles.json')
    ]);

    // Get EV efficiency
    const evVehicle = evData.find(d => d.model === ev);
    const evEfficiency = evVehicle ? evVehicle['kwh/100miles'] : 0;

    // Get gas efficiency
    const gasVehicle = gasVehicleData.find(d => d.model === gas);
    const gasEfficiency = gasVehicle ? gasVehicle['efficiency(gal/100miles)'] : 0;

    // Create data for each state
    Object.values(states).forEach(state => {
      const electricityPrice = electricityData.find(d => d.state === state);
      const costPerKwh = electricityPrice ? electricityPrice.price : 0;
      
      const gasPrice = gasPriceData.find(d => d.state === state);
      const costPerGallon = gasPrice ? gasPrice.price : 0;

      // Calculate costs
      const evCostPerMiles = (costPerKwh * evEfficiency) / 100;
      const evCostPer100Miles = evCostPerMiles / 100;
      const evAnnualCost = evCostPer100Miles * milesRange;

      const gasCostPerMiles = costPerGallon * gasEfficiency;
      const gasCostPer100Miles = gasCostPerMiles / 100;
      const gasAnnualCost = gasCostPer100Miles * milesRange;

      const savingEv = gasAnnualCost - evAnnualCost;

      // Create state data object
      const stateData = {
        "state": state,
        "cost/kwh": costPerKwh,
        "efficiency(ev)": evEfficiency,
        "cost/100miles(ev)": evCostPer100Miles,
        "cost/mile(ev)": evCostPerMiles,
        "totalannualcost(ev)": evAnnualCost,
        "annualsavings$(ev)": savingEv,
        "cost/gallon": costPerGallon,
        "efficiency(gas)": gasEfficiency,
        "cost/100miles(gas)": gasCostPer100Miles,
        "totalcost/mile(gas)": gasCostPerMiles,
        "totalannualcost(gas)": gasAnnualCost
      };
      
      stateChart.push(stateData);
    });

    // After all states are processed, redraw the map
    // Remove existing map
    $('#us-map').empty();
    initUSMap();

  } catch (error) {
    console.error("Error calculating state data:", error);
  }
}

