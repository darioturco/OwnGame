// Cost formulas match routes/constructions/costs.js exactly
// energyFn returns net energy: positive = produces, negative = consumes
var CALC_SPEED, CALC_TEMP;

var CONFIGS = [
  { key: 'metalMine',        sat: false, costFn: function(l){ return [Math.floor(60*Math.pow(1.5,l)),    Math.floor(15*Math.pow(1.5,l)),    0                              ]; }, energyFn: function(l){ return -Math.floor(10*l*Math.pow(1.1,l)); } },
  { key: 'crystalMine',      sat: false, costFn: function(l){ return [Math.floor(48*Math.pow(1.6,l)),    Math.floor(24*Math.pow(1.6,l)),    0                              ]; }, energyFn: function(l){ return -Math.floor(10*l*Math.pow(1.1,l)); } },
  { key: 'deuteriumMine',    sat: false, costFn: function(l){ return [Math.floor(225*Math.pow(1.5,l)),   Math.floor(75*Math.pow(1.5,l)),    0                              ]; }, energyFn: function(l){ return -Math.floor(20*l*Math.pow(1.1,l)); } },
  { key: 'solarPlant',       sat: false, costFn: function(l){ return [Math.floor(75*Math.pow(1.5,l)),    Math.floor(30*Math.pow(1.5,l)),    0                              ]; }, energyFn: function(l){ return  Math.floor(20*l*Math.pow(1.1,l)); } },
  { key: 'fusionReactor',    sat: false, costFn: function(l){ return [Math.floor(900*Math.pow(1.8,l)),   Math.floor(360*Math.pow(1.8,l)),   Math.floor(180*Math.pow(1.8,l))]; }, energyFn: function(l){ return  Math.floor(30*l*Math.pow(1.05,l)); } },
  { key: 'metalStorage',     sat: false, costFn: function(l){ return [Math.floor(1000*Math.pow(2,l)),    0,                                 0                              ]; }, energyFn: function(l){ return 0; } },
  { key: 'crystalStorage',   sat: false, costFn: function(l){ return [Math.floor(1000*Math.pow(2,l)),    Math.floor(500*Math.pow(2,l)),     0                              ]; }, energyFn: function(l){ return 0; } },
  { key: 'deuteriumStorage', sat: false, costFn: function(l){ return [Math.floor(1000*Math.pow(2,l)),    Math.floor(1000*Math.pow(2,l)),    0                              ]; }, energyFn: function(l){ return 0; } },
  { key: 'robotFactory',     sat: false, costFn: function(l){ return [Math.floor(400*Math.pow(2,l)),     Math.floor(120*Math.pow(2,l)),     Math.floor(200*Math.pow(2,l)) ]; }, energyFn: function(l){ return 0; } },
  { key: 'shipyard',         sat: false, costFn: function(l){ return [Math.floor(400*Math.pow(2,l)),     Math.floor(200*Math.pow(2,l)),     Math.floor(100*Math.pow(2,l)) ]; }, energyFn: function(l){ return 0; } },
  { key: 'researchLab',      sat: false, costFn: function(l){ return [Math.floor(200*Math.pow(2,l)),     Math.floor(400*Math.pow(2,l)),     Math.floor(200*Math.pow(2,l)) ]; }, energyFn: function(l){ return 0; } },
  { key: 'alliance',         sat: false, costFn: function(l){ return [Math.floor(20000*Math.pow(2,l)),   Math.floor(40000*Math.pow(2,l)),   0                              ]; }, energyFn: function(l){ return 0; } },
  { key: 'silo',             sat: false, costFn: function(l){ return [Math.floor(20000*Math.pow(2,l)),   Math.floor(20000*Math.pow(2,l)),   Math.floor(1000*Math.pow(2,l)) ]; }, energyFn: function(l){ return 0; } },
  { key: 'naniteFactory',    sat: false, costFn: function(l){ return [Math.floor(1000000*Math.pow(2,l)), Math.floor(500000*Math.pow(2,l)),  Math.floor(100000*Math.pow(2,l))]; }, energyFn: function(l){ return 0; } },
  { key: 'terraformer',      sat: false, costFn: function(l){ return [0,                                 Math.floor(50000*Math.pow(2,l)),   Math.floor(100000*Math.pow(2,l))]; }, energyFn: function(l){ return 0; } },
  { key: 'solarSatellite',   sat: true,  costFn: function(q){ return [0,                                 2000*q,                            500*q                          ]; }, energyFn: function(q){ return Math.floor((CALC_TEMP+160)/6)*q; } },
];

function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function totalCost(cfg, val) {
  if (cfg.sat) return cfg.costFn(val);
  var m = 0, c = 0, d = 0;
  for (var l = 0; l < val; l++) {
    var r = cfg.costFn(l);
    m += r[0]; c += r[1]; d += r[2];
  }
  return [m, c, d];
}

function updateCalculator() {
  var totM = 0, totC = 0, totD = 0, totE = 0;
  var lvls = {};

  CONFIGS.forEach(function(cfg) {
    var row = document.querySelector('tr[data-key="' + cfg.key + '"]');
    if (!row) return;
    var input  = row.querySelector('.level-input');
    var maxVal = cfg.sat ? 9999 : 50;
    var val    = Math.min(maxVal, Math.max(0, parseInt(input.value) || 0));
    input.value    = val;
    lvls[cfg.key]  = val;

    var cost   = totalCost(cfg, val);
    var energy = cfg.energyFn(val);

    row.querySelector('.calc-metal').textContent     = fmt(cost[0]);
    row.querySelector('.calc-crystal').textContent   = fmt(cost[1]);
    row.querySelector('.calc-deuterium').textContent = fmt(cost[2]);

    var eCell = row.querySelector('.calc-energy');
    eCell.textContent = (energy > 0 ? '+' : '') + fmt(energy);
    eCell.className   = 'calc-energy calc-num' + (energy > 0 ? ' undermark' : energy < 0 ? ' overmark' : '');

    totM += cost[0]; totC += cost[1]; totD += cost[2]; totE += energy;
  });

  document.getElementById('total-metal').textContent     = fmt(totM);
  document.getElementById('total-crystal').textContent   = fmt(totC);
  document.getElementById('total-deuterium').textContent = fmt(totD);

  var teEl = document.getElementById('total-energy');
  teEl.textContent = (totE > 0 ? '+' : '') + fmt(totE);
  teEl.className   = 'calc-num ' + (totE > 0 ? 'undermark' : totE < 0 ? 'overmark' : '');

  // Production at 100% efficiency, current planet temp, speed
  var m  = lvls.metalMine      || 0;
  var c  = lvls.crystalMine    || 0;
  var d  = lvls.deuteriumMine  || 0;
  var sp = lvls.solarPlant     || 0;
  var fr = lvls.fusionReactor  || 0;
  var ss = lvls.solarSatellite || 0;
  var spd = CALC_SPEED;
  var tmp = CALC_TEMP;

  var metalProd  = Math.floor(30*spd + 30*spd*m*Math.pow(1.1,m));
  var crystProd  = Math.floor(15*spd + 20*spd*c*Math.pow(1.1,c));
  var fusionDeut = Math.floor(10*spd*fr*Math.pow(1.1,fr));
  var deutProd   = Math.max(0, Math.floor(10*spd*d*Math.pow(1.1,d)*(1.36-0.004*tmp)) - fusionDeut);

  var eProd   = Math.floor(20*sp*Math.pow(1.1,sp)) + Math.floor(30*fr*Math.pow(1.05,fr)) + Math.floor((tmp+160)/6)*ss;
  var eNeeded = Math.floor(10*m*Math.pow(1.1,m)) + Math.floor(10*c*Math.pow(1.1,c)) + Math.floor(20*d*Math.pow(1.1,d));
  var eNet    = eProd - eNeeded;

  document.getElementById('ph-metal').textContent     = fmt(metalProd);
  document.getElementById('ph-crystal').textContent   = fmt(crystProd);
  document.getElementById('ph-deuterium').textContent = fmt(deutProd);

  var enetEl = document.getElementById('ph-energy');
  enetEl.textContent = (eNet > 0 ? '+' : '') + fmt(eNet);
  enetEl.className   = 'calc-num ' + (eNet >= 0 ? 'undermark' : 'overmark');

  document.getElementById('pd-metal').textContent     = fmt(metalProd * 24);
  document.getElementById('pd-crystal').textContent   = fmt(crystProd * 24);
  document.getElementById('pd-deuterium').textContent = fmt(deutProd  * 24);

  document.getElementById('pw-metal').textContent     = fmt(metalProd * 168);
  document.getElementById('pw-crystal').textContent   = fmt(crystProd * 168);
  document.getElementById('pw-deuterium').textContent = fmt(deutProd  * 168);
}

updateCalculator();
