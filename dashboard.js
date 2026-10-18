(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RewildingDashboard = api;
})(typeof window !== 'undefined' ? window : null, function () {
  const routes = Object.freeze({
    map: 'map',
    currentState: 'decision',
    rai: 'metric:rai',
    ppi: 'metric:ppi',
    vci: 'metric:vci',
    infrared: 'sensor:infrared',
    thermal: 'sensor:thermal',
    vegetation: 'sensor:vegetation',
    environment: 'sensor:environment',
    recommendedAction: 'intervention',
  });

  function createState() {
    return { view: 'home', zone: 'A' };
  }

  function reduceState(state, action) {
    if (action.type === 'OPEN' && routes[action.target]) {
      return { ...state, view: routes[action.target] };
    }
    if (action.type === 'SELECT_ZONE' && ['A', 'B', 'C', 'D'].includes(action.zone)) {
      return { ...state, view: 'map', zone: action.zone };
    }
    if (action.type === 'CLOSE') return createState();
    return state;
  }

  const metricData = {
    rai: {
      title: 'Rabbit Activity',
      accent: '#a3d9f6',
      rows: [
        ['Detection Frequency', 82],
        ['Activity Duration', 76],
        ['Patch Use Intensity', 84],
        ['Foraging Site Distribution', 71],
        ['Shelter Use Frequency', 63],
      ],
    },
    ppi: {
      title: 'Predator Pressure',
      accent: '#ee9176',
      rows: [
        ['Fox and Buzzard Detection Frequency', 64],
        ['Predator Dwell Duration', 58],
        ['Rabbit Hotspot Overlap', 67],
        ['Predator Proximity Index', 55],
      ],
    },
    vci: {
      title: 'Vegetation Condition',
      accent: '#cfe763',
      rows: [
        ['Grass Cover Density', 44],
        ['Grass Height Level', 39],
        ['Bare Ground Ratio', 32],
        ['Grazing Pressure Intensity', 26],
        ['Vegetation Recovery Rate', 41],
      ],
    },
  };

  const sensorData = {
    infrared: { title: 'Infrared Camera', count: 22, prefix: 'IC', groups: [7, 5, 5, 5] },
    thermal: { title: 'Thermal Camera', count: 16, prefix: 'TC', groups: [5, 4, 4, 3] },
    vegetation: { title: 'Vegetation Plot', count: 16, prefix: 'VP', groups: [4, 4, 4, 4] },
    environment: { title: 'Environmental Sensor', count: 8, prefix: 'ES', groups: [2, 2, 2, 2] },
  };

  const zoneStatus = {
    A: 'Under Watch',
    B: 'Prepared',
    C: 'Prepared',
    D: 'Stable',
  };

  const zoneMaps = Object.freeze({
    A: 'assets/patch-a.png',
    B: 'assets/patch-b.png',
    C: 'assets/patch-c.png',
    D: 'assets/patch-d.png',
  });

  function zoneMapFor(zone) {
    return zoneMaps[zone] || zoneMaps.A;
  }

  function deviceStatus(kind, id) {
    return kind === 'vegetation' && id === 'VP_B04' ? 'abnormal' : 'normal';
  }

  function deviceIds(sensor) {
    return sensor.groups.flatMap((count, groupIndex) => {
      const zone = String.fromCharCode(65 + groupIndex);
      return Array.from({ length: count }, (_, index) => `${sensor.prefix}_${zone}${String(index + 1).padStart(2, '0')}`);
    });
  }

  function closeButton() {
    return '<button class="close-button" data-action="close" type="button" aria-label="Close detail"></button>';
  }

  function renderMap(state) {
    const zones = [...Object.keys(zoneStatus)];
    return `
      ${closeButton()}
      <div class="large-map"><img src="${zoneMapFor(state.zone)}" alt="Monitoring map for Patch ${state.zone}" /></div>
      <div class="patch-panel">
        <h2>Patch Status</h2>
        <div class="zone-grid">
          ${zones.map(zone => `
            <button class="zone-button ${state.zone === zone ? 'active' : ''}" data-zone="${zone}" type="button">
              <span>${zone === 'Corridor' ? zone : `Patch ${zone}`}</span><small>${zoneStatus[zone]}</small>
            </button>`).join('')}
        </div>
      </div>`;
  }

  function renderMetric(kind) {
    const metric = metricData[kind];
    return `
      ${closeButton()}
      <h2 class="modal-title">${metric.title}</h2>
      <div class="data-card" style="--accent:${metric.accent}">
        <span>Collected Data</span>
        ${metric.rows.map(([label, value]) => `
          <div class="data-row">
            <header><span>${label}</span><b>${value}</b></header>
            <div class="data-bar"><i style="width:${value}%"></i></div>
          </div>`).join('')}
      </div>`;
  }

  function renderSensor(kind) {
    const sensor = sensorData[kind];
    return `
      ${closeButton()}
      <h2>${sensor.title}</h2>
      <p>${sensor.count} deployed units across 4 zones</p>
      <div class="device-head"><span>DEVICE CHECK</span><span>STATUS</span></div>
      <div class="device-list">
        ${deviceIds(sensor).map(id => {
          const status = deviceStatus(kind, id);
          return `<div class="device-row"><span>${id}</span><span class="normal-pill ${status}"><i></i>Normal</span></div>`;
        }).join('')}
      </div>`;
  }

  function renderDecision() {
    const matches = [
      'One indicator near the boundary',
      'Values remain within range, but trend is unexpected',
      'One indicator slightly beyond range',
    ];
    return `
      ${closeButton()}
      <div class="logic-card">
        <div class="logic-head"><span class="eyebrow">TRIGGER LOGIC</span><span class="output-pill">Output: Warning</span></div>
        <h2>Warning Rule Matched</h2>
        <p>The system checks range position, trend, persistence and indicator combination before assigning the current state.</p>
        <div class="logic-facts">
          <div class="logic-fact"><span>RANGE</span><b>Near edge</b></div>
          <div class="logic-fact"><span>TREND</span><b>Unexpected</b></div>
          <div class="logic-fact"><span>PERSIST</span><b>One cycle</b></div>
          <div class="logic-fact"><span>COMBINATION</span><b>Single / early</b></div>
        </div>
        <div class="matched">
          <header><span>Matched Trigger Conditions</span><b>Warning</b></header>
          ${matches.map(text => `<div class="matched-row"><i>✓</i><span>${text}</span><b>Met</b></div>`).join('')}
        </div>
        <div class="decision-note"><b>Decision:</b> increase monitoring frequency. No spatial intervention starts during Warning.</div>
      </div>
      <div class="decision-card">
        <div class="decision-title"><h2>Decision</h2><span class="ready-pill">Ready to start</span></div>
        <div class="decision-steps">
          <div class="decision-step"><i>1</i><span>Check data reliability</span></div>
          <div class="decision-step"><i>2</i><span>Increase monitoring frequency</span></div>
          <div class="decision-step"><i>3</i><span>Review again in Cycle3</span></div>
        </div>
        <div class="decision-footer"><span>No patch activation during Warning</span><button class="start-button" id="start-warning" type="button">Start Warning</button></div>
      </div>`;
  }

  function renderIntervention() {
    const measures = [
      'Open Patch B as the active feeding patch',
      'Pause Patch A and let vegetation recover',
      'Adjust grass height to guide redistribution',
      'Strengthen corridor between main grass and Patch B',
    ];
    return `
      ${closeButton()}
      <div class="intervention-panel">
        <span class="eyebrow">INTERVENTION DETAIL</span>
        <h2>Feeding Patch Rotation</h2>
        <div class="trigger-box"><span>TRIGGER</span><b>RAI high + VCI low</b></div>
        <div class="task-section"><h3>MEASURES</h3>${measures.map(text => `<div class="task-line"><i></i>${text}</div>`).join('')}</div>
        <div class="task-section section-divider"><h3>MONITOR</h3><div class="task-line"><i></i>Check RAI redistribution and VCI recovery for 2 cycles</div></div>
        <div class="task-section"><h3>EXIT</h3><div class="task-line"><i></i>VCI stable</div><div class="task-line"><i></i>RAI back to normal</div></div>
      </div>`;
  }

  function modalClass(view) {
    if (view === 'map') return 'modal modal-map';
    if (view === 'decision') return 'modal decision-modal';
    if (view === 'intervention') return 'modal intervention-modal';
    if (view.startsWith('metric:')) return 'modal metric-modal';
    return 'modal sensor-modal';
  }

  function modalMarkup(state) {
    if (state.view === 'map') return renderMap(state);
    if (state.view === 'decision') return renderDecision();
    if (state.view === 'intervention') return renderIntervention();
    if (state.view.startsWith('metric:')) return renderMetric(state.view.split(':')[1]);
    if (state.view.startsWith('sensor:')) return renderSensor(state.view.split(':')[1]);
    return '';
  }

  function mount(documentRef, windowRef) {
    const stage = documentRef.getElementById('dashboard');
    const layer = documentRef.getElementById('modal-layer');
    const modal = documentRef.getElementById('modal');
    const search = documentRef.getElementById('dashboard-search');
    if (!stage || !layer || !modal) return;

    let state = createState();
    let previousFocus = null;

    function scaleStage() {
      const scale = Math.min(windowRef.innerWidth / 1440, windowRef.innerHeight / 1024);
      stage.style.setProperty('--scale', String(scale));
    }

    function render() {
      stage.dataset.view = state.view;
      if (state.view === 'home') {
        layer.hidden = true;
        modal.innerHTML = '';
        if (previousFocus) previousFocus.focus();
        return;
      }
      layer.hidden = false;
      modal.className = modalClass(state.view);
      modal.innerHTML = modalMarkup(state);
      modal.querySelector('.close-button')?.focus();
    }

    function dispatch(action) {
      state = reduceState(state, action);
      render();
    }

    stage.addEventListener('click', event => {
      const zoneButton = event.target.closest('[data-zone]');
      if (zoneButton) {
        dispatch({ type: 'SELECT_ZONE', zone: zoneButton.dataset.zone });
        return;
      }
      const actionTarget = event.target.closest('[data-action]');
      if (!actionTarget) return;
      const action = actionTarget.dataset.action;
      if (action === 'close') dispatch({ type: 'CLOSE' });
      else {
        previousFocus = actionTarget;
        dispatch({ type: 'OPEN', target: action });
      }
    });

    modal.addEventListener('click', event => {
      const start = event.target.closest('#start-warning');
      if (!start) return;
      start.textContent = 'Warning active';
      start.disabled = true;
      modal.querySelector('.ready-pill').textContent = 'Monitoring started';
    });

    documentRef.addEventListener('keydown', event => {
      if (event.key === 'Escape' && state.view !== 'home') dispatch({ type: 'CLOSE' });
    });

    search?.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      const query = search.value.trim().toLowerCase();
      const match = Object.keys(routes).find(key => key.toLowerCase().includes(query));
      if (match) dispatch({ type: 'OPEN', target: match });
    });

    windowRef.addEventListener('resize', scaleStage);
    scaleStage();
    render();
  }

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount(document, window));
    else mount(document, window);
  }

  return { createState, reduceState, routes, metricData, sensorData, deviceIds, zoneMapFor, deviceStatus, mount };
});
