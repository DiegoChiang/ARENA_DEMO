const slides = [];

let currentSlide = 0;
let currentStep = 0;
let simTimer = null;
let simIndex = 0;
let crossFocus = 'llegadas';

const slideEl = document.getElementById('slide');
const slideNav = document.getElementById('slideNav');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const btnPrevSlide = document.getElementById('btnPrevSlide');
const btnNextSlide = document.getElementById('btnNextSlide');
const btnPrevStep = document.getElementById('btnPrevStep');
const btnNextStep = document.getElementById('btnNextStep');
const helpDialog = document.getElementById('helpDialog');

function varBox(name, value) {
  return `<div class="var-box"><div class="var-name">${name}</div><div class="var-value">${value}</div></div>`;
}
function metric(name, value) {
  return `<div class="metric-card"><small>${name}</small><strong>${value}</strong></div>`;
}
function pct(part,total){
  if(!total) return '—';
  return `${((part/total)*100).toFixed(1)}%`;
}
function sourcePanel(facts, activeIndex, sourceLabel='ENUNCIADO DEL CASO') {
  return `
    <div class="problem-context">
      <span class="source-chip">${sourceLabel}</span>
      <div class="problem-fact-list">
        ${facts.map((f,i)=>`<div class="problem-fact ${i===activeIndex?'active':i<activeIndex?'done':''}">${f}</div>`).join('')}
      </div>
    </div>`;
}
function techFlow(nodes, activeId, visibleCount=nodes.length, note='') {
  return `
    <div class="tech-flow">
      ${nodes.map((n,i)=>{
        const state = i>=visibleCount ? 'future' : n.id===activeId ? 'active' : (i<visibleCount ? 'done' : '');
        const node = `<div class="tech-node ${n.type==='decision'?'decision':''} ${state}"><span class="type">${n.typeLabel || n.type || 'paso'}</span>${n.label}</div>`;
        return `${i>0?'<div class="tech-arrow">↓</div>':''}${node}`;
      }).join('')}
      ${note?`<div class="tech-note">${note}</div>`:''}
    </div>`;
}
function arenaModuleShape(m, isFuture, isActive) {
  const kind = m.kind || 'process';
  const classes = ['arena-module', `kind-${kind}`];
  if (isFuture) classes.push('future');
  if (isActive) classes.push('active');
  return `<div class="${classes.join(' ')}"><span>${m.label}</span></div>`;
}

function isArenaNodeActive(node, activeModule) {
  if (!activeModule) return false;
  if (node.id === activeModule) return true;
  if ((node.aliases || []).includes(activeModule)) return true;
  return false;
}
function arenaPositionedModule(node, activeModule) {
  const kind = node.kind || 'process';
  const classes = ['arena-module','placed',`kind-${kind}`];
  if (isArenaNodeActive(node, activeModule)) classes.push('active');
  const style = `left:${node.x}px;top:${node.y}px;`;
  return `<div class="${classes.join(' ')}" style="${style}"><span>${node.label}</span></div>`;
}
function arenaLine(line) {
  const style = `left:${line.x}px;top:${line.y}px;width:${line.w || 2}px;height:${line.h || 2}px;`;
  return `<div class="arena-line ${line.arrow ? 'arrow-'+line.arrow : ''}" style="${style}"></div>`;
}
function arenaFullDiagram(activeModule='') {
  const nodes = [
    {id:'change',label:'Lanzar cambio\nde media',kind:'create',x:10,y:12},
    {id:'assignMedia',label:'Assign 3',kind:'assign',x:124,y:12},
    {id:'stop',label:'Dispose 3',kind:'dispose',x:228,y:12},

    {id:'create',aliases:['cliente'],label:'Llegada de\nclientes',kind:'create',x:2,y:110},
    {id:'assign',aliases:['cantidad','hora'],label:'Assign 1',kind:'assign',x:124,y:110},
    {id:'decide',label:'Hay\nCANTIDAD\nde artículos?',kind:'decide',x:248,y:94},
    {id:'select',aliases:['process','yes','articulo'],label:'Seleccionar\nartículos',kind:'process',x:370,y:110},
    {id:'pay',aliases:['cajera'],label:'Pagar',kind:'process',x:484,y:110},
    {id:'returnDecision',label:'Devuelve 1\nartículo?',kind:'decide',x:605,y:94},
    {id:'return',label:'Devolver\nartículo',kind:'process',x:720,y:80},
    {id:'assign2',label:'Assign 2',kind:'assign',x:815,y:80},
    {id:'release',aliases:['releaseCashier'],label:'Liberar a la\ncajera',kind:'process',x:744,y:182},
    {id:'wrap',aliases:['senorita'],label:'Solicitar\nenvoltura',kind:'process',x:900,y:156},
    {id:'record',label:'Record 1',kind:'record',x:1008,y:156},
    {id:'dispose',label:'Dispose 1',kind:'dispose',x:1100,y:156},
    {id:'no',label:'Dispose 2',kind:'dispose',x:296,y:182},

    {id:'trigger',label:'Lanzar\nreposición',kind:'create',x:26,y:264},
    {id:'order',label:'Assign 4',kind:'assign',x:130,y:264},
    {id:'lead',label:'Tiempo de\nentrega',kind:'delay',x:252,y:248},
    {id:'replenish',aliases:['articulo'],label:'Assign 5',kind:'assign',x:370,y:264},
    {id:'dispose4',label:'Dispose 4',kind:'dispose',x:487,y:264},

    {id:'add1',label:'Assign +1\nSeñorita',kind:'assign',x:620,y:264},
    {id:'add2',label:'Assign +1\nSeñorita',kind:'assign',x:744,y:264}
  ];
  const lines = [
    {x:108,y:131,w:16,arrow:'right'},
    {x:196,y:131,w:52,arrow:'right'},
    {x:322,y:131,w:48,arrow:'right'},
    {x:458,y:131,w:26,arrow:'right'},
    {x:572,y:131,w:33,arrow:'right'},

    {x:679,y:131,w:25}, {x:704,y:101,h:30}, {x:704,y:101,w:16,arrow:'right'},

    {x:285,y:168,h:35}, {x:285,y:203,w:11,arrow:'right'},
    {x:642,y:168,h:35}, {x:642,y:203,w:102,arrow:'right'},

    {x:808,y:101,w:14}, {x:822,y:101,h:76}, {x:822,y:177,w:78,arrow:'right'},
    {x:832,y:203,w:38}, {x:870,y:177,h:26}, {x:870,y:177,w:30,arrow:'right'},
    {x:988,y:177,w:20,arrow:'right'}, {x:1084,y:177,w:16,arrow:'right'},

    {x:108,y:33,w:16,arrow:'right'}, {x:196,y:33,w:32,arrow:'right'},
    {x:124,y:285,w:6,arrow:'right'}, {x:202,y:285,w:50,arrow:'right'}, {x:326,y:285,w:44,arrow:'right'}, {x:442,y:285,w:45,arrow:'right'},
    {x:585,y:285,w:35,arrow:'right'}, {x:692,y:285,w:52,arrow:'right'}
  ];
  return `<div class="arena-full-diagram">${lines.map(arenaLine).join('')}${nodes.map(n=>arenaPositionedModule(n, activeModule)).join('')}<div class="arena-branch-label true1" style="left:327px;top:117px;">True</div><div class="arena-branch-label false1" style="left:286px;top:170px;">False</div><div class="arena-branch-label true2" style="left:684px;top:117px;">True</div><div class="arena-branch-label false2" style="left:646px;top:170px;">False</div></div>`;
}


function arenaEscDiagram(activeModule='') {
  const nodes = [
    {id:'change',label:'Lanzar cambio\nde media',kind:'create',x:10,y:12},
    {id:'assignMedia',label:'Assign 1',kind:'assign',x:126,y:12},
    {id:'stop',label:'Dispose 1',kind:'dispose',x:238,y:12},

    {id:'create',aliases:['cliente'],label:'Llegada del\ncliente',kind:'create',x:2,y:106},
    {id:'assign',aliases:['cantidad','hora'],label:'Assign 2',kind:'assign',x:114,y:106},
    {id:'decide',label:'Hay CANTIDAD\nde artículos?',kind:'decide',x:222,y:90},
    {id:'select',aliases:['process','yes','articulo'],label:'Seleccionar\nartículos',kind:'process',x:335,y:106},
    {id:'pay',aliases:['cajera'],label:'Pagar',kind:'process',x:440,y:106},
    {id:'returnDecision',label:'Desea\ndevolver\nartículo?',kind:'decide',x:552,y:90},
    {id:'return',label:'Devolver\nartículo',kind:'process',x:653,y:106},
    {id:'assign3',aliases:['assign3'],label:'Assign 3',kind:'assign',x:756,y:106},
    {id:'wrap',aliases:['senorita'],label:'Envolver',kind:'process',x:873,y:106},
    {id:'record',label:'Record 1',kind:'record',x:976,y:106},
    {id:'dispose3',label:'Dispose 3',kind:'dispose',x:1073,y:106},
    {id:'release',aliases:['releaseCashier'],label:'Liberar a la\ncajera',kind:'process',x:771,y:182},
    {id:'dispose2',label:'Dispose 2',kind:'dispose',x:286,y:198},

    {id:'trigger',label:'Lanzar\nreposición\nde artículos',kind:'create',x:0,y:282},
    {id:'order',label:'Assign 4',kind:'assign',x:108,y:282},
    {id:'lead',label:'Tiempo de\nentrega',kind:'delay',x:221,y:266},
    {id:'replenish',aliases:['articulo'],label:'Assign 5',kind:'assign',x:334,y:282},
    {id:'dispose5',label:'Dispose 5',kind:'dispose',x:446,y:282},

    {id:'arriveLady',aliases:['ladyCreate'],label:'Lanzar llegada\nde señorita',kind:'create',x:580,y:282},
    {id:'add1',aliases:['assign6'],label:'Assign 6',kind:'assign',x:694,y:282},
    {id:'wait',label:'Pasan 30\nmin',kind:'delay',x:807,y:266},
    {id:'add2',aliases:['assign7'],label:'Assign 7',kind:'assign',x:920,y:282},
    {id:'dispose6',label:'Dispose 6',kind:'dispose',x:1034,y:282}
  ];
  const lines = [
    {x:104,y:33,w:22,arrow:'right'}, {x:198,y:33,w:40,arrow:'right'},

    {x:96,y:127,w:18,arrow:'right'}, {x:186,y:127,w:36,arrow:'right'}, {x:296,y:127,w:39,arrow:'right'}, {x:423,y:127,w:17,arrow:'right'}, {x:513,y:127,w:39,arrow:'right'},
    {x:624,y:127,w:29,arrow:'right'}, {x:728,y:127,w:28,arrow:'right'}, {x:828,y:127,w:45,arrow:'right'}, {x:957,y:127,w:19,arrow:'right'}, {x:1046,y:127,w:27,arrow:'right'},
    {x:258,y:165,h:54}, {x:258,y:219,w:28,arrow:'right'},
    {x:588,y:165,h:37}, {x:588,y:202,w:183,arrow:'right'},
    {x:842,y:202,h:21}, {x:842,y:127,w:31,arrow:'up'},

    {x:95,y:303,w:13,arrow:'right'}, {x:180,y:303,w:41,arrow:'right'}, {x:294,y:303,w:40,arrow:'right'}, {x:406,y:303,w:40,arrow:'right'},
    {x:676,y:303,w:18,arrow:'right'}, {x:780,y:303,w:27,arrow:'right'}, {x:880,y:303,w:40,arrow:'right'}, {x:992,y:303,w:42,arrow:'right'}
  ];
  return `<div class="arena-full-diagram arena-esc-diagram">${lines.map(arenaLine).join('')}${nodes.map(n=>arenaPositionedModule(n, activeModule)).join('')}<div class="arena-branch-label" style="left:300px;top:113px;">True</div><div class="arena-branch-label" style="left:257px;top:170px;">False</div><div class="arena-branch-label" style="left:593px;top:113px;">True</div><div class="arena-branch-label" style="left:589px;top:170px;">False</div></div>`;
}

function simEventToArena(eventName) {
  return ({
    'Llegada':'create',
    '¿Stock?':'decide',
    'Seleccionar':'select',
    'Pagar':'pay',
    '¿Devuelve?':'returnDecision',
    'Devolver':'return',
    'Liberar cajera':'release',
    'Envolver':'wrap',
    'Record':'record',
    'Reposición':'order',
    'Pedido en tránsito':'lead',
    'Reponer':'replenish'
  })[eventName] || '';
}
function simTokenStyle(eventName) {
  const map = {
    'Llegada':'left:30px;top:90px;',
    '¿Stock?':'left:190px;top:92px;',
    'Seleccionar':'left:287px;top:92px;',
    'Pagar':'left:390px;top:92px;',
    '¿Devuelve?':'left:488px;top:92px;',
    'Devolver':'left:590px;top:72px;',
    'Liberar cajera':'left:592px;top:146px;',
    'Envolver':'left:704px;top:129px;',
    'Record':'left:784px;top:129px;',
    'Reposición':'left:106px;top:207px;',
    'Pedido en tránsito':'left:193px;top:207px;',
    'Reponer':'left:286px;top:207px;'
  };
  return map[eventName] || 'left:30px;top:90px;';
}

function renderArenaSimulator(e) {
  const active = simEventToArena(e.node);
  return `
    <div class="arena-shell arena-shell-realistic sim-arena-shell">
      <div class="arena-ribbon-tabs"><span class="file-tab">FILE</span><span class="active">Home</span><span>Animate</span><span>Draw</span><span>Run</span><span>View</span><span>Tools</span><span>Developer</span></div>
      <div class="arena-ribbon-strip"><span>Attach</span><span>Detach</span><span>Copy</span><span>Select and Zoom</span><span>Find</span><span>Layers</span><span>Connect</span><span>Auto-Connect</span><span>Expression Builder</span><span>Check Model</span></div>
      <div class="arena-worktabs"><span class="arena-worktab active">Tienda de regalos</span><span class="arena-worktab">Tienda de regalos ESC</span></div>
      <div class="arena-main realistic sim-layout">
        <div class="arena-projectbar realistic">
          <div class="arena-project-header">Project Bar</div>
          <div class="arena-section"><div class="arena-section-title red">Data Definition</div><div class="arena-palette-item">Entity</div><div class="arena-palette-item">Resource</div><div class="arena-palette-item">Queue</div><div class="arena-palette-item">Variable</div><div class="arena-palette-item">Attribute</div></div>
          <div class="arena-section"><div class="arena-section-title green">Discrete Processing</div><div class="arena-palette-item ${active==='create'?'active':''}">Create</div><div class="arena-palette-item ${active==='dispose'?'active':''}">Dispose</div><div class="arena-palette-item ${active==='assign' || active==='order' || active==='replenish'?'active':''}">Assign</div><div class="arena-palette-item ${active==='record'?'active':''}">Record</div></div>
          <div class="arena-section"><div class="arena-section-title lime">Input Output</div><div class="arena-palette-item ${['select','pay','return','release','wrap','lead'].includes(active)?'active':''}">Process / Delay</div></div>
          <div class="arena-section"><div class="arena-section-title gold">Decisions</div><div class="arena-palette-item ${['decide','returnDecision'].includes(active)?'active':''}">Decide</div></div>
        </div>
        <div class="arena-canvas realistic sim-canvas-arena">
          ${arenaFullDiagram(active)}
          <div class="sim-token" style="${simTokenStyle(e.node)}"></div>
        </div>
        <aside class="sim-info-panel">
          <div class="sim-annot sim-annot-main">
            <div class="sim-annot-title">Evento actual · ${e.t}</div>
            <div class="sim-annot-text">${e.msg}</div>
          </div>
          <div class="sim-annot sim-annot-metrics">
            <div class="sim-mini-metric"><span>ARTICULO</span><strong>${e.stock}</strong></div>
            <div class="sim-mini-metric"><span>Cajeras ocup.</span><strong>${e.cBusy}/2</strong></div>
            <div class="sim-mini-metric"><span>Señoritas ocup.</span><strong>${e.wBusy}/2</strong></div>
            <div class="sim-mini-metric"><span>Cola caja</span><strong>${e.cq}</strong></div>
          </div>
          <div class="sim-annot sim-annot-controls">
            <button type="button" id="simPrev" class="secondary-btn">← Evento</button>
            <button type="button" id="simNext" class="primary-btn">Evento →</button>
            <button type="button" id="simRun" class="secondary-btn">▶ Run</button>
            <button type="button" id="simPause" class="secondary-btn">Ⅱ Pause</button>
            <button type="button" id="simReset" class="secondary-btn">Reset</button>
          </div>
        </aside>
      </div>
      <div class="arena-spreadsheet realistic sim-spreadsheet">
        <div class="arena-tabs"><span class="arena-tab active">Anotaciones de simulación</span><span class="arena-tab">Ruta didáctica</span></div>
        <div class="sim-spread-grid">
          <div class="sim-log-box">${simEvents.slice(Math.max(0,simIndex-4),simIndex+1).map(x=>`<div>[${x.t}] ${x.msg}</div>`).join('')}</div>
          <div class="sim-route-box"><div class="route-pill ${e.node==='Llegada'?'active':''}">Llegada</div><div class="route-pill ${e.node==='¿Stock?'?'active':''}">¿Stock?</div><div class="route-pill ${e.node==='Seleccionar'?'active':''}">Seleccionar</div><div class="route-pill ${e.node==='Pagar'?'active':''}">Pagar</div><div class="route-pill ${e.node==='¿Devuelve?'?'active':''}">¿Devuelve?</div><div class="route-pill ${e.node==='Devolver'?'active':''}">Devolver</div><div class="route-pill ${e.node==='Liberar cajera'?'active':''}">Liberar cajera</div><div class="route-pill ${e.node==='Envolver'?'active':''}">Envolver</div><div class="route-pill ${e.node==='Record'?'active':''}">Record</div><div class="route-pill ${e.node==='Reposición'?'active':''}">Reposición</div><div class="route-pill ${e.node==='Pedido en tránsito'?'active':''}">Pedido en tránsito</div><div class="route-pill ${e.node==='Reponer'?'active':''}">Reponer</div></div>
        </div>
      </div>
    </div>`;
}
function expressionBuilder(builder) {
  if (!builder) return '';
  const paths = (builder.paths || []).map(item=>`<div class="expr-path-row"><div class="expr-symbol">${item[0]}</div><div class="expr-location">${item[1]}</div></div>`).join('');
  const tree = builder.tree || [
    ['Current Model Variables and Functions', ['Entity','Process','Queue','Resource','Statistic','User-Defined Attribute','Variable']],
    ['Random Distributions', []],
    ['Math Functions', []],
    ['Replication Variables', []]
  ];
  return `
    <div class="expr-builder-window ${builder.compact ? 'compact' : ''}">
      <div class="expr-titlebar"><span>Expression Builder</span><span>×</span></div>
      <div class="expr-main">
        <div class="expr-tree-panel">
          <div class="expr-label">Expression Type:</div>
          <div class="expr-tree">
            ${tree.map(([root,children],i)=>`<div class="expr-tree-item ${i===0?'root-open':''}"><div class="expr-tree-root">${root}</div>${children.length?`<div class="expr-tree-children">${children.map(c=>`<div class="expr-tree-child">${c}</div>`).join('')}</div>`:''}</div>`).join('')}
          </div>
        </div>
        <div class="expr-help-panel">
          <div class="expr-label">Para esta expresión busca:</div>
          <div class="expr-path-list">${paths}</div>
        </div>
      </div>
      <div class="expr-opbar"><span>+</span><span>-</span><span>×</span><span>/</span><span>=</span><span>&lt;&gt;</span><span>&lt;</span><span>&gt;</span><span>&lt;=</span><span>&gt;=</span><span>and</span><span>or</span><span>()</span><span>C</span></div>
      <div class="expr-label">Current Expression:</div>
      <div class="expr-current">${builder.expression || ''}</div>
      ${builder.tip ? `<div class="expr-tip"><strong>Ruta sugerida:</strong> ${builder.tip}</div>` : ''}
      <div class="arena-dialog-actions expr-actions"><button class="arena-win-btn">OK</button><button class="arena-win-btn">Cancel</button><button class="arena-win-btn">Help</button></div>
    </div>`;
}
function arenaView({paletteActive='', flow=[], activeModule='', visibleCount=flow.length, dialogTitle='', fields=[], activeField='', sheetRows=[], builder=null, activeTab='Tienda de regalos', diagram='main'}) {
  const sections = [
    {name:'Data Definition', color:'red', items:['Entity','Resource','Queue','Variable','Attribute']},
    {name:'Discrete Processing', color:'green', items:['Create','Dispose','Batch','Separate','Assign','Record']},
    {name:'Input Output', color:'lime', items:['Process','Delay','Release']},
    {name:'Decisions', color:'gold', items:['Decide']},
    {name:'Animation', color:'orange', items:[]},
    {name:'Grouping', color:'pink', items:[]},
    {name:'Material Handling', color:'blue', items:[]}
  ];
  return `
    <div class="arena-shell arena-shell-realistic">
      <div class="arena-ribbon-tabs"><span class="file-tab">FILE</span><span class="active">Home</span><span>Animate</span><span>Draw</span><span>Run</span><span>View</span><span>Tools</span><span>Developer</span></div>
      <div class="arena-ribbon-strip"><span>Attach</span><span>Detach</span><span>Copy</span><span>Select and Zoom</span><span>Find</span><span>Layers</span><span>Connect</span><span>Auto-Connect</span><span>Expression Builder</span><span>Check Model</span></div>
      <div class="arena-worktabs"><span class="arena-worktab ${activeTab==='Tienda de regalos'?'active':''}">Tienda de regalos</span><span class="arena-worktab ${activeTab==='Tienda de regalos ESC'?'active':''}">Tienda de regalos ESC</span></div>
      <div class="arena-main realistic">
        <div class="arena-projectbar realistic">
          <div class="arena-project-header">Project Bar</div>
          ${sections.map(sec=>`<div class="arena-section"><div class="arena-section-title ${sec.color}">${sec.name}</div>${sec.items.map(item=>`<div class="arena-palette-item ${item===paletteActive?'active':''}">${item}</div>`).join('')}</div>`).join('')}
        </div>
        <div class="arena-canvas realistic">
          ${diagram==='esc' ? arenaEscDiagram(activeModule) : arenaFullDiagram(activeModule)}
          ${dialogTitle?`
            <div class="arena-dialog realistic">
              <div class="arena-dialog-title"><span>${dialogTitle}</span><span>×</span></div>
              <div class="arena-dialog-body">
                ${fields.map(f=>`<div class="arena-field ${f[0]===activeField?'active':''}"><label>${f[0]}</label><div class="value">${f[1]}</div></div>`).join('')}
              </div>
              <div class="arena-dialog-actions"><button class="arena-win-btn">OK</button><button class="arena-win-btn">Cancel</button><button class="arena-win-btn">Help</button></div>
            </div>`:''}
          ${expressionBuilder(builder)}
        </div>
      </div>
      <div class="arena-spreadsheet realistic">
        <div class="arena-tabs"><span class="arena-tab active">Name</span><span class="arena-tab">Type</span><span class="arena-tab">Action</span><span class="arena-tab">Delay Type</span><span class="arena-tab">Units</span><span class="arena-tab">Value / Expression</span></div>
        <div class="arena-sheet-row header"><span>Name</span><span>Type</span><span>Value / Capacity</span></div>
        ${(sheetRows.length?sheetRows:[['—','—','—']]).map(r=>`<div class="arena-sheet-row"><span>${r[0]}</span><span>${r[1]}</span><span>${r[2]}</span></div>`).join('')}
      </div>
    </div>`;
}
function ribbon(source,tech,arena) {
  return `<div class="trace-ribbon mobile-trace"><div class="ribbon-box ribbon-source">${source}</div><div class="ribbon-arrow">→</div><div class="ribbon-box ribbon-tech">${tech}</div><div class="ribbon-arrow">→</div><div class="ribbon-box ribbon-arena">${arena}</div></div>`;
}
function traceSide(source, tech, arena) {
  return `<div class="trace-side"><div class="trace-side-title">Relación directa</div><div class="trace-side-flow"><div class="trace-side-box source">${source}</div><div class="trace-side-arrow">→</div><div class="trace-side-box tech">${tech}</div><div class="trace-side-arrow">→</div><div class="trace-side-box arena">${arena}</div></div></div>`;
}
function triad({kicker,title,subtitle,facts,activeFact,techNodes,techActive,techVisible,techNote,arenaConfig,sourceLabel,ribbonText,note}) {
  return `
    <div class="slide-kicker">${kicker}</div>
    <h2 class="slide-title">${title}</h2>
    ${subtitle?`<p class="slide-subtitle">${subtitle}</p>`:''}
    <div class="triad-grid ${ribbonText?'with-trace-side':''}">
      <section class="triad-panel"><div class="triad-head problem"><span>1 · Texto del problema</span><span>ORIGEN</span></div><div class="triad-body">${sourcePanel(facts,activeFact,sourceLabel)}</div></section>
      <section class="triad-panel"><div class="triad-head tech"><span>2 · Dibujo técnico</span><span>MODELO</span></div><div class="triad-body">${techFlow(techNodes,techActive,techVisible,techNote)}</div></section>
      <section class="triad-panel"><div class="triad-head arena"><span>3 · Arena</span><span>IMPLEMENTACIÓN</span></div><div class="triad-body">${arenaView(arenaConfig)}</div></section>
      ${ribbonText?`<section class="triad-panel trace-side-panel"><div class="triad-head trace"><span>4 · Relación</span><span>TRAZABILIDAD</span></div><div class="triad-body">${traceSide(...ribbonText)}</div></section>`:''}
    </div>
    ${ribbonText?ribbon(...ribbonText):''}
    ${note?`<div class="step-callout"><strong>Qué debes notar</strong><span>${note}</span></div>`:''}
  `;
}
function makeTriadSlide(spec) {
  slides.push({
    title: spec.title,
    short: spec.short,
    steps: spec.steps.length,
    render(step){
      const s=spec.steps[Math.min(step,spec.steps.length-1)];
      return triad({
        kicker:spec.kicker,
        title:spec.heading,
        subtitle:spec.subtitle,
        facts:spec.facts,
        activeFact:s.activeFact ?? 0,
        techNodes:spec.techNodes,
        techActive:s.techActive || '',
        techVisible:s.techVisible ?? spec.techNodes.length,
        techNote:s.techNote || '',
        arenaConfig:{
          paletteActive:s.paletteActive || '',
          flow:spec.arenaFlow,
          activeModule:s.arenaActive || '',
          visibleCount:s.arenaVisible ?? spec.arenaFlow.length,
          dialogTitle:s.dialogTitle || '',
          fields:s.fields || [],
          activeField:s.activeField || '',
          sheetRows:s.sheetRows || [],
          builder:s.builder || null,
          activeTab:s.activeTab || 'Tienda de regalos',
          diagram:s.diagram || 'main'
        },
        sourceLabel:s.sourceLabel || 'ENUNCIADO DEL CASO',
        ribbonText:s.ribbon,
        note:s.note
      });
    }
  });
}

/* 01 · Objetivo */
slides.push({
  title:'Recursos no reusables', short:'Objetivo', steps:4,
  render(step){
    const blocks=[
      ['Comprender','qué cambia cuando un recurso se consume y no regresa automáticamente.'],
      ['Modelar','la tienda de regalos conectando caso, dibujo técnico y Arena.'],
      ['Ejecutar','una mini simulación para observar stock, colas y recursos.'],
      ['Transferir','la lógica a un segundo caso: tienda de llaveritos.']
    ];
    const reveal=Math.min(step+1,blocks.length);
    return `
      <div class="slide-kicker">01 · Semana 06 · Simulación</div>
      <h2 class="slide-title">Recursos <span class="highlight">No Reusables</span></h2>
      <p class="slide-subtitle">La meta no es memorizar módulos. Es poder leer una frase del problema y justificar cómo se transforma en un modelo y luego en Arena.</p>
      <div class="grid-2" style="margin-top:18px">
        <div class="card accent-card">
          <h3>Regla de toda la clase</h3>
          <div class="big-equation" style="font-size:24px">Texto ⇄ Dibujo ⇄ Arena</div>
          <p style="margin-top:10px">Las tres vistas permanecerán vinculadas durante la resolución.</p>
        </div>
        <div class="trace-panel">
          ${blocks.slice(0,reveal).map((b,i)=>`<div class="card ${i===reveal-1?'good-card fade-in':''}"><h3>${b[0]}</h3><p>${b[1]}</p></div>`).join('')}
        </div>
      </div>`;
  }
});

/* 02 · Concepto reusable/no reusable */
slides.push({
  title:'Reusable vs no reusable', short:'Concepto vivo', steps:8,
  render(step){
    const stock=[80,80,77,77,77,77,77,77][step];
    const cashier=['LIBRE','LIBRE','LIBRE','OCUPADA','OCUPADA','LIBRE','LIBRE','LIBRE'][step];
    const note=[
      'Partimos de dos recursos diferentes: artículos y cajera.',
      'Entra un cliente que desea 3 artículos.',
      'El cliente toma 3 artículos: el stock baja de 80 a 77.',
      'El cliente llega a caja y ocupa una cajera.',
      'Durante la atención, la cajera sigue ocupada.',
      'Termina la atención y la cajera vuelve a estar disponible.',
      'Los artículos vendidos no reaparecen por terminar la atención.',
      'Conclusión: cajera = reusable; artículo = no reusable.'
    ][step];
    return `
      <div class="slide-kicker">02 · Para recordar</div>
      <h2 class="slide-title">¿Qué significa realmente <span class="highlight">“no reusable”</span>?</h2>
      <div class="concept-compare">
        <div class="card accent-card">
          <h3>ARTICULO · recurso no reusable</h3>
          <div class="resource-watch"><div class="resource-row"><span>Stock</span><div class="resource-bar"><div class="resource-fill stock" style="width:${stock/80*100}%"></div></div><strong>${stock}</strong></div></div>
          <div class="lifecycle"><span class="life-node ${step>=2?'active':''}">Disponible</span><span class="life-arrow">→</span><span class="life-node ${step>=2?'active':''}">Consumido</span><span class="life-arrow">→</span><span class="life-node">NO vuelve solo</span></div>
        </div>
        <div class="card good-card">
          <h3>CAJERA · recurso reusable</h3>
          <div class="big-equation" style="font-size:23px">${cashier}</div>
          <div class="lifecycle"><span class="life-node ${step>=3?'active':''}">Seize</span><span class="life-arrow">→</span><span class="life-node ${step>=4?'active':''}">Delay</span><span class="life-arrow">→</span><span class="life-node good ${step>=5?'active':''}">Release</span><span class="life-arrow">→</span><span class="life-node good ${step>=5?'active':''}">Disponible</span></div>
        </div>
      </div>
      ${ribbon(step<2?'“pasteles / artículos”':'“cliente toma 3 artículos”', step<5?'Stock disminuye':'Ciclo de vida del recurso', step<5?'ARTICULO sin Release':'Cajera: Seize → Delay → Release')}
      <div class="step-callout"><strong>Micro-paso ${step+1}</strong><span>${note}</span></div>`;
  }
});

/* 03 · Mapa del caso */
slides.push({
  title:'Tienda de regalos · leer el caso', short:'Mapa del problema', steps:9,
  render(step){
    const items=[
      ['Llegadas','10–14 h: EXPO(8). 14–18 h: EXPO(12). Luego se cierran llegadas.'],
      ['Cantidad','Cada cliente desea entre 2 y 4 artículos, redondeado al entero más cercano.'],
      ['Stock','Si no hay suficientes artículos, el cliente se retira descontento.'],
      ['Selección','Tomar los artículos tarda UNIF(10,20) minutos, sin importar la cantidad.'],
      ['Caja','Una sola cola, 2 cajeras, atención TRIA(1,3,5) minutos.'],
      ['Devolución','10% devuelve 1 artículo; la devolución tarda 0.5 minutos.'],
      ['Envoltura','2 señoritas; UNIF(1,2) minutos por cada artículo.'],
      ['Reposición','Stock inicial 80; cada 3 h se pide para volver a 80; solo 2 pedidos; entrega UNIF(0.3,0.5) h.'],
      ['Indicadores','Tiempo promedio del cliente y contenido final de la vitrina.']
    ];
    const current=items[Math.min(step,items.length-1)];
    const type=['Create / control','Assign','Decide','Process + ARTICULO','Process + Cajera','Decide + devolución','Process + Señorita','Flujo paralelo','Record + Resource'][step];
    return `
      <div class="slide-kicker">03 · Lectura antes de modelar</div>
      <h2 class="slide-title">Primero extraemos <span class="highlight">decisiones de modelado</span></h2>
      <p class="slide-subtitle">No se arrastra ningún módulo hasta entender qué representa cada frase.</p>
      <div class="case-map">${items.map((x,i)=>`<div class="case-chip ${i===step?'active':''}"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}</div>
      <div class="step-callout"><strong>${current[0]} → ${type}</strong><span>${current[1]}</span></div>`;
  }
});

/* 04 · Entidad, atributos y recursos */
makeTriadSlide({
  title:'Entidad, atributos y recursos', short:'Qué existe en el modelo', kicker:'04 · Estructura del sistema',
  heading:'Antes del flujo: <span class="highlight">¿qué cosas existen?</span>',
  subtitle:'La entidad fluye; los atributos viajan con ella; los recursos representan capacidad o inventario.',
  facts:[
    '“los clientes llegan…”',
    '“cantidad de artículos entre 2 y 4”',
    'medir tiempo desde la llegada',
    '“inicialmente la vitrina tiene 80 artículos”',
    '“cualquiera de dos cajeras”',
    '“se cuenta con dos señoritas”'
  ],
  techNodes:[
    {id:'cliente',label:'Entidad: Cliente',type:'entidad'},
    {id:'cantidad',label:'Atributo: CANTIDAD',type:'atributo'},
    {id:'hora',label:'Atributo: HoraLlegada',type:'atributo'},
    {id:'articulo',label:'Recurso: ARTICULO · capacidad 80',type:'no reusable'},
    {id:'cajera',label:'Recurso: Cajera · capacidad 2',type:'reusable'},
    {id:'senorita',label:'Recurso: Señorita · capacidad 2',type:'reusable'}
  ],
  arenaFlow:[
    {id:'cliente',label:'Entity: Cliente',kind:'control'},
    {id:'cantidad',label:'Attribute: CANTIDAD',kind:'assign'},
    {id:'hora',label:'Attribute: HoraLlegada',kind:'assign'},
    {id:'articulo',label:'Resource: ARTICULO',kind:'process'},
    {id:'cajera',label:'Resource: Cajera',kind:'process'},
    {id:'senorita',label:'Resource: Señorita',kind:'process'}
  ],
  steps:[
    {activeFact:0,techActive:'cliente',techVisible:1,paletteActive:'',arenaActive:'cliente',arenaVisible:1,ribbon:['“clientes”','Entidad Cliente','Data → Entity: Cliente'],note:'Cliente es la entidad principal porque es lo que fluye por el sistema.'},
    {activeFact:1,techActive:'cantidad',techVisible:2,paletteActive:'Attribute',arenaActive:'cantidad',arenaVisible:2,ribbon:['“cantidad entre 2 y 4”','Atributo CANTIDAD','Data → Attribute'],note:'CANTIDAD pertenece a cada cliente; no es una variable global.'},
    {activeFact:2,techActive:'hora',techVisible:3,paletteActive:'Attribute',arenaActive:'hora',arenaVisible:3,ribbon:['medir desde que llega','Atributo HoraLlegada','Assign: HoraLlegada = TNOW'],note:'Guardamos el reloj de llegada para medir el tiempo del cliente después.'},
    {activeFact:3,techActive:'articulo',techVisible:4,paletteActive:'Resource',arenaActive:'articulo',arenaVisible:4,dialogTitle:'Resource: ARTICULO',fields:[['Name','ARTICULO'],['Type','Fixed Capacity'],['Capacity','80']],activeField:'Capacity',sheetRows:[['ARTICULO','Resource','80']],ribbon:['“vitrina tiene 80 artículos”','Inventario no reusable','Resource ARTICULO · Capacity 80'],note:'ARTICULO usa la capacidad del recurso para representar unidades disponibles.'},
    {activeFact:4,techActive:'cajera',techVisible:5,paletteActive:'Resource',arenaActive:'cajera',arenaVisible:5,dialogTitle:'Resource: Cajera',fields:[['Name','Cajera'],['Type','Fixed Capacity'],['Capacity','2']],activeField:'Capacity',sheetRows:[['Cajera','Resource','2']],ribbon:['“dos cajeras”','Capacidad de atención = 2','Resource Cajera · Capacity 2'],note:'Cajera sí vuelve a estar disponible después de cada servicio.'},
    {activeFact:5,techActive:'senorita',techVisible:6,paletteActive:'Resource',arenaActive:'senorita',arenaVisible:6,dialogTitle:'Resource: Señorita',fields:[['Name','Señorita'],['Type','Fixed Capacity'],['Capacity','2']],activeField:'Capacity',sheetRows:[['Señorita','Resource','2']],ribbon:['“dos señoritas”','Capacidad de envoltura = 2','Resource Señorita · Capacity 2'],note:'La capacidad 2 permite dos envolturas simultáneas.'}
  ]
});

/* 05 · Llegadas */
makeTriadSlide({
  title:'Llegadas de clientes', short:'Create + cambio de media', kicker:'05 · Llegadas 10:00–18:00',
  heading:'Una frase temporal se convierte en <span class="highlight">lógica de llegadas</span>',
  subtitle:'La presentación sigue la implementación del modelo .doe: una variable MEDIA gobierna el Create y un flujo de control cambia su valor.',
  facts:[
    '10:00–14:00: llegadas exponenciales con media 8 min',
    '14:00–18:00: llegadas exponenciales con media 12 min',
    '18:00: dejan de entrar nuevos clientes',
    'los clientes que ya llegaron terminan su atención'
  ],
  techNodes:[
    {id:'create',label:'Llegada de Cliente',type:'llegada'},
    {id:'media8',label:'MEDIA = 8 min',type:'parámetro'},
    {id:'change',label:'A las 4 h: MEDIA = 12',type:'evento temporal'},
    {id:'stop',label:'A las 8 h: cerrar llegadas',type:'fin de generación'}
  ],
  arenaFlow:[
    {id:'create',label:'Create · Llegada de clientes',kind:'create'},
    {id:'change',label:'Create · Lanzar cambio de media',kind:'control'},
    {id:'assignMedia',label:'Assign · MEDIA = 12',kind:'assign'},
    {id:'stop',label:'Control · no más llegadas',kind:'control'}
  ],
  steps:[
    {activeFact:0,techActive:'create',techVisible:1,paletteActive:'Create',arenaActive:'create',arenaVisible:1,ribbon:['“clientes llegan…”','Nodo de llegada','Create'],note:'Primero identificamos que necesitamos un generador de entidades.'},
    {activeFact:0,techActive:'create',techVisible:1,paletteActive:'Create',arenaActive:'create',arenaVisible:1,dialogTitle:'Create',fields:[['Name','Llegada de clientes'],['Entity Type','Cliente'],['Type','Random'],['Units','Minutes'],['Expression','EXPO(MEDIA)']],activeField:'Name',ribbon:['Llegada de clientes','Nombrar el evento','Create.Name'],note:'El nombre debe describir el evento del problema.'},
    {activeFact:0,techActive:'create',techVisible:1,paletteActive:'Create',arenaActive:'create',arenaVisible:1,dialogTitle:'Create',fields:[['Name','Llegada de clientes'],['Entity Type','Cliente'],['Type','Random'],['Units','Minutes'],['Expression','EXPO(MEDIA)']],activeField:'Entity Type',ribbon:['“clientes”','Entidad generada = Cliente','Entity Type = Cliente'],note:'Create crea entidades Cliente, no recursos ni atributos.'},
    {activeFact:0,techActive:'media8',techVisible:2,paletteActive:'Variable',arenaActive:'create',arenaVisible:1,dialogTitle:'Variable',fields:[['Name','MEDIA'],['Initial Value','8'],['Units','Minutes']],activeField:'Initial Value',sheetRows:[['MEDIA','Variable','8']],ribbon:['“media de 8 minutos”','MEDIA inicial = 8','Variable MEDIA = 8'],note:'La media se hace explícita para poder cambiarla después.'},
    {activeFact:0,techActive:'media8',techVisible:2,paletteActive:'Create',arenaActive:'create',arenaVisible:1,dialogTitle:'Create',fields:[['Name','Llegada de clientes'],['Type','Random'],['Units','Minutes'],['Expression','EXPO(MEDIA)']],activeField:'Type',ribbon:['distribución exponencial','Llegada aleatoria','Type = Random'],note:'Random indica que el tiempo entre llegadas se obtiene de una distribución.'},
    {activeFact:0,techActive:'media8',techVisible:2,paletteActive:'Create',arenaActive:'create',arenaVisible:1,dialogTitle:'Create',fields:[['Name','Llegada de clientes'],['Type','Random'],['Units','Minutes'],['Expression','EXPO(MEDIA)']],activeField:'Units',ribbon:['“minutos”','Unidad base del intervalo','Units = Minutes'],note:'Las unidades deben coincidir con el enunciado.'},
    {activeFact:0,techActive:'media8',techVisible:2,paletteActive:'Create',arenaActive:'create',arenaVisible:1,dialogTitle:'Create',fields:[['Name','Llegada de clientes'],['Type','Random'],['Units','Minutes'],['Expression','EXPO(MEDIA)']],activeField:'Expression',builder:{expression:'EXPO(MEDIA)',paths:[['EXPO','Random Distributions'],['MEDIA','Current Model Variables and Functions → Variable']],tip:'Primero inserta EXPO desde Random Distributions y luego reemplaza su argumento por la variable MEDIA.'},ribbon:['“exponencial, media 8”','EXPO(MEDIA)','Expression = EXPO(MEDIA)'],note:'Al inicio MEDIA=8, por lo que la expresión equivale a EXPO(8). Para abrir el Builder: clic derecho en Expression.'},
    {activeFact:1,techActive:'change',techVisible:3,paletteActive:'Create',arenaActive:'change',arenaVisible:2,ribbon:['“siguientes 4 horas: media 12”','Evento a t=4 h','Create de control'],note:'Para cambiar MEDIA necesitamos un evento de control independiente del flujo de clientes.'},
    {activeFact:1,techActive:'change',techVisible:3,paletteActive:'Create',arenaActive:'change',arenaVisible:2,dialogTitle:'Create · control',fields:[['Name','Lanzar cambio de media'],['Type','Constant'],['First Creation','4 hours'],['Max Arrivals','1'],['Entity Type','CONTROL']],activeField:'First Creation',ribbon:['cambio después de 4 h','Disparar una sola vez','First Creation = 4 h'],note:'Este flujo no representa un cliente; representa un evento temporal.'},
    {activeFact:1,techActive:'change',techVisible:3,paletteActive:'Assign',arenaActive:'assignMedia',arenaVisible:3,ribbon:['“media 12”','Actualizar parámetro','Assign'],note:'El evento de control llega al Assign que cambia la media.'},
    {activeFact:1,techActive:'change',techVisible:3,paletteActive:'Assign',arenaActive:'assignMedia',arenaVisible:3,dialogTitle:'Assign',fields:[['Name','Cambiar MEDIA'],['Type','Variable'],['Variable','MEDIA'],['New Value','12']],activeField:'New Value',sheetRows:[['MEDIA','Variable','12']],ribbon:['“media de 12 minutos”','MEDIA: 8 → 12','Assign MEDIA = 12'],note:'Desde ese momento las nuevas llegadas usan EXPO(12).'},
    {activeFact:2,techActive:'stop',techVisible:4,paletteActive:'Create',arenaActive:'stop',arenaVisible:4,ribbon:['“a las 6 pm no entran más”','Cerrar generación a t=8 h','Control de fin de llegadas'],note:'La tienda abre a las 10:00; ocho horas después son las 18:00.'},
    {activeFact:3,techActive:'stop',techVisible:4,paletteActive:'Dispose',arenaActive:'stop',arenaVisible:4,ribbon:['“se terminará de atender a los que llegaron”','No borrar entidades existentes','Solo se detiene Create'],note:'Cerrar llegadas NO significa terminar la simulación inmediatamente.'}
  ]
});

/* 06 · Assign */
makeTriadSlide({
  title:'Atributos del cliente', short:'Assign', kicker:'06 · CANTIDAD + HoraLlegada',
  heading:'Cada cliente entra con <span class="highlight">información propia</span>',
  subtitle:'El Assign guarda lo que luego usarán el Decide, los Process y el Record.',
  facts:[
    'cada cliente desea entre 2 y 4 artículos',
    'redondear al entero más cercano',
    'necesitamos recordar cuándo llegó el cliente'
  ],
  techNodes:[
    {id:'cliente',label:'Cliente llega',type:'entidad'},
    {id:'cantidad',label:'CANTIDAD = ANINT(UNIF(2,4))',type:'atributo'},
    {id:'hora',label:'HoraLlegada = TNOW',type:'atributo'}
  ],
  arenaFlow:[
    {id:'create',label:'Create · Llegada de clientes',kind:'create'},
    {id:'assign',label:'Assign · Datos del cliente',kind:'assign'}
  ],
  steps:[
    {activeFact:0,techActive:'cliente',techVisible:1,paletteActive:'Assign',arenaActive:'assign',arenaVisible:2,ribbon:['cliente ya creado','añadir datos a la entidad','Assign'],note:'Assign no crea otra entidad; modifica la entidad Cliente que ya existe.'},
    {activeFact:0,techActive:'cantidad',techVisible:2,paletteActive:'Assign',arenaActive:'assign',arenaVisible:2,dialogTitle:'Assign',fields:[['Name','Datos del cliente'],['Assignment 1 · Type','Attribute'],['Attribute','CANTIDAD'],['New Value','ANINT(UNIF(2,4))']],activeField:'Assignment 1 · Type',ribbon:['“cantidad…”','dato individual','Type = Attribute'],note:'La cantidad debe viajar con cada cliente.'},
    {activeFact:0,techActive:'cantidad',techVisible:2,paletteActive:'Assign',arenaActive:'assign',arenaVisible:2,dialogTitle:'Assign',fields:[['Name','Datos del cliente'],['Assignment 1 · Type','Attribute'],['Attribute','CANTIDAD'],['New Value','ANINT(UNIF(2,4))']],activeField:'Attribute',ribbon:['cantidad deseada','atributo CANTIDAD','Attribute = CANTIDAD'],note:'Este nombre se reutilizará en stock y tiempos de envoltura.'},
    {activeFact:1,techActive:'cantidad',techVisible:2,paletteActive:'Assign',arenaActive:'assign',arenaVisible:2,dialogTitle:'Assign',fields:[['Name','Datos del cliente'],['Assignment 1 · Type','Attribute'],['Attribute','CANTIDAD'],['New Value','ANINT(UNIF(2,4))']],activeField:'New Value',builder:{expression:'ANINT(UNIF(2,4))',paths:[['ANINT','Math Functions'],['UNIF','Random Distributions']],tip:'Construye primero UNIF(2,4) y luego aplica ANINT( ) para redondear al entero más cercano.'},ribbon:['“entre 2 y 4, redondear”','ANINT(UNIF(2,4))','New Value'],note:'UNIF genera el valor continuo y ANINT lo redondea al entero más cercano.'},
    {activeFact:2,techActive:'hora',techVisible:3,paletteActive:'Assign',arenaActive:'assign',arenaVisible:2,dialogTitle:'Assign',fields:[['Assignment 2 · Type','Attribute'],['Attribute','HoraLlegada'],['New Value','TNOW']],activeField:'Attribute',ribbon:['medir tiempo del cliente','atributo HoraLlegada','Attribute = HoraLlegada'],note:'Necesitamos un segundo atributo para medir el intervalo al final.'},
    {activeFact:2,techActive:'hora',techVisible:3,paletteActive:'Assign',arenaActive:'assign',arenaVisible:2,dialogTitle:'Assign',fields:[['Assignment 2 · Type','Attribute'],['Attribute','HoraLlegada'],['New Value','TNOW']],activeField:'New Value',builder:{expression:'TNOW',paths:[['TNOW','Current Model Variables and Functions → Variable del sistema']],tip:'Si el docente lo prefiere, puede escribir TNOW manualmente; el Builder sirve para reforzar que es una variable del sistema.'},sheetRows:[['CANTIDAD','Attribute','ANINT(UNIF(2,4))'],['HoraLlegada','Attribute','TNOW']],ribbon:['instante de llegada','capturar reloj actual','HoraLlegada = TNOW'],note:'TNOW es el reloj actual de simulación.'}
  ]
});

/* 07 · Decide stock */
makeTriadSlide({
  title:'¿Hay suficientes artículos?', short:'Decide de stock', kicker:'07 · Stock antes de comprar',
  heading:'La vitrina decide si el cliente <span class="highlight">puede continuar</span>',
  subtitle:'El cliente solo selecciona artículos si el stock disponible cubre su CANTIDAD.',
  facts:[
    'si la vitrina tiene menos artículos que los deseados, el cliente se retira',
    'si hay suficientes, selecciona y toma la cantidad deseada'
  ],
  techNodes:[
    {id:'arrive',label:'Cliente con CANTIDAD',type:'entidad'},
    {id:'stock',label:'Stock = MR(ARTICULO) − NR(ARTICULO)',type:'cálculo'},
    {id:'decide',label:'¿Stock ≥ CANTIDAD?',type:'decision',typeLabel:'decisión'},
    {id:'yes',label:'Sí → seleccionar artículos',type:'rama true'},
    {id:'no',label:'No → salida descontento',type:'rama false'}
  ],
  arenaFlow:[
    {id:'assign',label:'Assign · CANTIDAD',kind:'assign'},
    {id:'decide',label:'Decide · Hay CANTIDAD de artículos?',kind:'decide'},
    {id:'yes',label:'TRUE · Seleccionar artículos',kind:'process'},
    {id:'no',label:'FALSE · Dispose descontento',kind:'dispose'}
  ],
  steps:[
    {activeFact:0,techActive:'arrive',techVisible:1,paletteActive:'Decide',arenaActive:'decide',arenaVisible:2,ribbon:['“si la vitrina…”','necesitamos una decisión','Decide'],note:'La condición depende del atributo del cliente y del stock del recurso.'},
    {activeFact:0,techActive:'stock',techVisible:2,paletteActive:'Resource',arenaActive:'decide',arenaVisible:2,ribbon:['vitrina disponible','MR − NR','stock de ARTICULO'],note:'MR representa capacidad del recurso y NR las unidades ocupadas/no disponibles.'},
    {activeFact:0,techActive:'decide',techVisible:3,paletteActive:'Decide',arenaActive:'decide',arenaVisible:2,dialogTitle:'Decide',fields:[['Name','Hay CANTIDAD de artículos?'],['Type','2-way by Condition'],['If','Expression'],['Condition','MR(ARTICULO)-NR(ARTICULO) >= CANTIDAD']],activeField:'Name',ribbon:['pregunta de disponibilidad','rombo de decisión','Decide.Name'],note:'El nombre del módulo debe ser una pregunta que puedas responder con True/False.'},
    {activeFact:0,techActive:'decide',techVisible:3,paletteActive:'Decide',arenaActive:'decide',arenaVisible:2,dialogTitle:'Decide',fields:[['Name','Hay CANTIDAD de artículos?'],['Type','2-way by Condition'],['If','Expression'],['Condition','MR(ARTICULO)-NR(ARTICULO) >= CANTIDAD']],activeField:'Type',ribbon:['dos resultados posibles','dos ramas','2-way by Condition'],note:'No es una decisión probabilística: depende del estado actual del stock.'},
    {activeFact:0,techActive:'decide',techVisible:3,paletteActive:'Decide',arenaActive:'decide',arenaVisible:2,dialogTitle:'Decide',fields:[['Name','Hay CANTIDAD de artículos?'],['Type','2-way by Condition'],['If','Expression'],['Condition','MR(ARTICULO)-NR(ARTICULO) >= CANTIDAD']],activeField:'Condition',builder:{expression:'MR(ARTICULO) - NR(ARTICULO) >= CANTIDAD',paths:[['MR','Current Model Variables and Functions → Resource'],['NR','Current Model Variables and Functions → Resource'],['CANTIDAD','Current Model Variables and Functions → User-Defined Attribute']],tip:'Con MR y NR calculas el stock disponible; luego comparas ese resultado con el atributo CANTIDAD usando >=.'},ribbon:['stock suficiente','Stock ≥ CANTIDAD','MR(ARTICULO)-NR(ARTICULO) >= CANTIDAD'],note:'Esta es la traducción directa de la frase del problema.'},
    {activeFact:1,techActive:'yes',techVisible:4,paletteActive:'Process',arenaActive:'yes',arenaVisible:3,ribbon:['“en caso contrario selecciona”','rama TRUE','Process Seleccionar artículos'],note:'TRUE significa que la condición de disponibilidad sí se cumple.'},
    {activeFact:0,techActive:'no',techVisible:5,paletteActive:'Dispose',arenaActive:'no',arenaVisible:4,ribbon:['“se retira descontento”','rama FALSE','Dispose'],note:'El cliente que no encuentra suficiente stock abandona el sistema sin comprar.'}
  ]
});

/* 08 · Seleccionar artículos */
makeTriadSlide({
  title:'Seleccionar artículos', short:'Recurso no reusable', kicker:'08 · Consumo de ARTICULO',
  heading:'Aquí se ve por qué ARTICULO es <span class="highlight">no reusable</span>',
  subtitle:'El cliente toma CANTIDAD unidades y esas unidades no regresan automáticamente al recurso.',
  facts:[
    'si hay stock, toma la cantidad deseada',
    'seleccionar y tomar tarda UNIF(10,20) minutos',
    'el tiempo total no depende de cuántos artículos toma'
  ],
  techNodes:[
    {id:'enter',label:'Cliente aprobado por stock',type:'entrada'},
    {id:'seize',label:'Tomar CANTIDAD de ARTICULO',type:'consumo'},
    {id:'delay',label:'Selección: UNIF(10,20) min',type:'actividad'},
    {id:'norelease',label:'ARTICULO no se libera',type:'no reusable'}
  ],
  arenaFlow:[
    {id:'decide',label:'TRUE desde Decide de stock',kind:'decide'},
    {id:'process',label:'Process · Seleccionar artículos',kind:'process'}
  ],
  steps:[
    {activeFact:0,techActive:'enter',techVisible:1,paletteActive:'Process',arenaActive:'process',arenaVisible:2,ribbon:['hay stock','inicia actividad','Process'],note:'El Process solo recibe clientes que pasaron el Decide.'},
    {activeFact:0,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'process',arenaVisible:2,dialogTitle:'Process',fields:[['Name','Seleccionar artículos'],['Action','Seize Delay'],['Resource','ARTICULO'],['Quantity','CANTIDAD'],['Delay Type','Uniform'],['Min','10'],['Max','20'],['Units','Minutes']],activeField:'Action',ribbon:['cliente toma artículos','consumir recurso','Action = Seize Delay'],note:'Seize Delay permite tomar el recurso sin liberarlo al final de esta actividad.'},
    {activeFact:0,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'process',arenaVisible:2,dialogTitle:'Process',fields:[['Name','Seleccionar artículos'],['Action','Seize Delay'],['Resource','ARTICULO'],['Quantity','CANTIDAD']],activeField:'Resource',ribbon:['artículos de vitrina','recurso no reusable','Resource = ARTICULO'],note:'El recurso representa unidades físicas disponibles.'},
    {activeFact:0,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'process',arenaVisible:2,dialogTitle:'Process',fields:[['Resource','ARTICULO'],['Quantity','CANTIDAD']],activeField:'Quantity',ribbon:['“cantidad deseada”','consumir exactamente CANTIDAD','Quantity = CANTIDAD'],note:'Cada entidad consume una cantidad distinta según su atributo.'},
    {activeFact:1,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'process',arenaVisible:2,dialogTitle:'Process',fields:[['Delay Type','Uniform'],['Min','10'],['Max','20'],['Units','Minutes']],activeField:'Delay Type',ribbon:['“uniforme entre 10 y 20”','duración aleatoria uniforme','Delay Type = Uniform'],note:'La distribución pertenece al tiempo de la actividad, no a la cantidad.'},
    {activeFact:1,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'process',arenaVisible:2,dialogTitle:'Process',fields:[['Delay Type','Uniform'],['Min','10'],['Max','20'],['Units','Minutes']],activeField:'Min',ribbon:['límite inferior 10','UNIF(10,20)','Min = 10'],note:'Primer parámetro de la uniforme.'},
    {activeFact:1,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'process',arenaVisible:2,dialogTitle:'Process',fields:[['Delay Type','Uniform'],['Min','10'],['Max','20'],['Units','Minutes']],activeField:'Max',ribbon:['límite superior 20','UNIF(10,20)','Max = 20'],note:'Segundo parámetro de la uniforme.'},
    {activeFact:2,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'process',arenaVisible:2,dialogTitle:'Process',fields:[['Delay Type','Uniform'],['Min','10'],['Max','20'],['Units','Minutes']],activeField:'Units',ribbon:['“minutos”','unidad del tiempo','Units = Minutes'],note:'No multiplicamos por CANTIDAD porque el problema dice que es tiempo total.'},
    {activeFact:0,techActive:'norelease',techVisible:4,paletteActive:'Resource',arenaActive:'process',arenaVisible:2,sheetRows:[['ARTICULO','Capacity','80'],['Seleccionar artículos.Queue','FIFO','—']],ribbon:['artículo vendido','stock baja y queda consumido','no hay Release automático'],note:'Este es el rasgo central de un recurso no reusable.'}
  ]
});

/* 09 · Caja */
makeTriadSlide({
  title:'Pagar', short:'Cola + cajeras', kicker:'09 · Recurso reusable Cajera',
  heading:'Una cola, dos cajeras, <span class="highlight">una atención por cliente</span>',
  subtitle:'La cajera se mantiene ocupada hasta resolver si el cliente devolverá un artículo.',
  facts:[
    'los clientes hacen una sola cola',
    'pueden ser atendidos por cualquiera de dos cajeras',
    'cada cajera atiende a un cliente a la vez',
    'tiempo de atención TRIA(1,3,5) minutos'
  ],
  techNodes:[
    {id:'queue',label:'Cola única de caja',type:'cola'},
    {id:'seize',label:'Tomar 1 Cajera',type:'seize'},
    {id:'delay',label:'Atender TRIA(1,3,5) min',type:'delay'},
    {id:'hold',label:'Mantener cajera ocupada',type:'espera de decisión'}
  ],
  arenaFlow:[
    {id:'select',label:'Seleccionar artículos',kind:'process'},
    {id:'pay',label:'Process · Pagar',kind:'process'},
    {id:'returnDecision',label:'Decide · ¿Devuelve?',kind:'decide'}
  ],
  steps:[
    {activeFact:0,techActive:'queue',techVisible:1,paletteActive:'Queue',arenaActive:'pay',arenaVisible:2,sheetRows:[['Pagar.Queue','FIFO','1 cola']],ribbon:['“una sola cola”','cola compartida','Pagar.Queue · FIFO'],note:'Las dos cajeras toman clientes de la misma cola.'},
    {activeFact:1,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Name','Pagar'],['Action','Seize Delay'],['Resource','Cajera'],['Quantity','1'],['Delay Type','Triangular'],['Min','1'],['Mode','3'],['Max','5'],['Units','Minutes']],activeField:'Name',ribbon:['actividad de pago','Process Pagar','Name = Pagar'],note:'El módulo representa la atención en caja.'},
    {activeFact:1,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Action','Seize Delay'],['Resource','Cajera'],['Quantity','1']],activeField:'Action',ribbon:['la cajera debe quedar ocupada','Seize sin liberar todavía','Action = Seize Delay'],note:'No liberamos inmediatamente porque la posible devolución también requiere a la cajera.'},
    {activeFact:1,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Resource','Cajera'],['Quantity','1']],activeField:'Resource',sheetRows:[['Cajera','Resource','Capacity 2']],ribbon:['“cualquiera de dos cajeras”','recurso Cajera','Resource = Cajera'],note:'La capacidad 2 está definida en el Resource, no en este Process.'},
    {activeFact:2,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Resource','Cajera'],['Quantity','1']],activeField:'Quantity',ribbon:['“un cliente a la vez”','cada entidad usa 1 cajera','Quantity = 1'],note:'Dos clientes pueden estar simultáneamente en servicio porque Capacity=2.'},
    {activeFact:3,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Delay Type','Triangular'],['Min','1'],['Mode','3'],['Max','5'],['Units','Minutes']],activeField:'Delay Type',ribbon:['“triangular”','TRIA(1,3,5)','Delay Type = Triangular'],note:'La forma de la distribución se selecciona antes de escribir parámetros.'},
    {activeFact:3,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Min','1'],['Mode','3'],['Max','5'],['Units','Minutes']],activeField:'Min',ribbon:['mínimo 1','TRIA(1,3,5)','Min = 1'],note:'Mínimo.'},
    {activeFact:3,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Min','1'],['Mode','3'],['Max','5'],['Units','Minutes']],activeField:'Mode',ribbon:['más probable 3','TRIA(1,3,5)','Mode = 3'],note:'Moda.'},
    {activeFact:3,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Min','1'],['Mode','3'],['Max','5'],['Units','Minutes']],activeField:'Max',ribbon:['máximo 5','TRIA(1,3,5)','Max = 5'],note:'Máximo.'},
    {activeFact:3,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'pay',arenaVisible:2,dialogTitle:'Process',fields:[['Units','Minutes']],activeField:'Units',ribbon:['“minutos”','unidad de atención','Units = Minutes'],note:'El modelo mantiene consistencia de unidades.'},
    {activeFact:1,techActive:'hold',techVisible:4,paletteActive:'Decide',arenaActive:'returnDecision',arenaVisible:3,ribbon:['la devolución se solicita a la cajera','cajera sigue ocupada','pasar al Decide sin Release'],note:'Esta decisión de diseño evita que otra entidad tome esa cajera antes de terminar la posible devolución.'}
  ]
});

/* 10 · Devolución */
makeTriadSlide({
  title:'Devolución de un artículo', short:'Decide 10% + devolución', kicker:'10 · Rama posterior al pago',
  heading:'El 10% activa una rama que <span class="highlight">devuelve inventario</span>',
  subtitle:'Además debemos actualizar CANTIDAD porque el cliente ya no llevará todos los artículos que había seleccionado.',
  facts:[
    '10% de los clientes decide devolver un artículo',
    'la devolución requiere 0.5 minutos',
    'el artículo devuelto vuelve a estar disponible',
    'después se libera la cajera'
  ],
  techNodes:[
    {id:'decide',label:'¿Devuelve 1 artículo?',type:'decision',typeLabel:'10% / 90%'},
    {id:'qty',label:'CANTIDAD = CANTIDAD − 1',type:'actualizar atributo'},
    {id:'return',label:'Devolver 1 ARTICULO · 0.5 min',type:'reposición puntual'},
    {id:'release',label:'Liberar Cajera',type:'release'}
  ],
  arenaFlow:[
    {id:'pay',label:'Pagar',kind:'process'},
    {id:'decide',label:'Decide · Devuelve 1 artículo?',kind:'decide'},
    {id:'assign',label:'Assign · CANTIDAD − 1',kind:'assign'},
    {id:'return',label:'Process · Devolver artículo',kind:'process'},
    {id:'release',label:'Release · Cajera',kind:'process'}
  ],
  steps:[
    {activeFact:0,techActive:'decide',techVisible:1,paletteActive:'Decide',arenaActive:'decide',arenaVisible:2,ribbon:['“10%”','decisión probabilística','Decide'],note:'A diferencia del stock, aquí la rama sí depende de probabilidad.'},
    {activeFact:0,techActive:'decide',techVisible:1,paletteActive:'Decide',arenaActive:'decide',arenaVisible:2,dialogTitle:'Decide',fields:[['Name','Devuelve 1 artículo?'],['Type','2-way by Chance'],['Percent True','10']],activeField:'Type',ribbon:['dos ramas con probabilidad','10% / 90%','2-way by Chance'],note:'TRUE será la rama de devolución.'},
    {activeFact:0,techActive:'decide',techVisible:1,paletteActive:'Decide',arenaActive:'decide',arenaVisible:2,dialogTitle:'Decide',fields:[['Name','Devuelve 1 artículo?'],['Type','2-way by Chance'],['Percent True','10']],activeField:'Percent True',ribbon:['“10%”','P(True)=0.10','Percent True = 10'],note:'El 90% restante sale por False.'},
    {activeFact:0,techActive:'qty',techVisible:2,paletteActive:'Assign',arenaActive:'assign',arenaVisible:3,ribbon:['devuelve uno de los seleccionados','cantidad que lleva disminuye','Assign'],note:'La cantidad final que se envolverá ya no es la cantidad original.'},
    {activeFact:0,techActive:'qty',techVisible:2,paletteActive:'Assign',arenaActive:'assign',arenaVisible:3,dialogTitle:'Assign',fields:[['Attribute','CANTIDAD'],['New Value','CANTIDAD - 1']],activeField:'New Value',builder:{expression:'CANTIDAD - 1',paths:[['CANTIDAD','Current Model Variables and Functions → User-Defined Attribute']],tip:'El atributo CANTIDAD se reutiliza y luego se resta 1 con los botones del Builder o escribiendo directamente.'},ribbon:['“uno de los artículos”','CANTIDAD − 1','Assign CANTIDAD = CANTIDAD - 1'],note:'Esto también afecta el tiempo posterior de envoltura.'},
    {activeFact:1,techActive:'return',techVisible:3,paletteActive:'Process',arenaActive:'return',arenaVisible:4,ribbon:['“requiere 0.5 minutos”','actividad de devolución','Process Devolver artículo'],note:'La devolución tiene tiempo propio.'},
    {activeFact:1,techActive:'return',techVisible:3,paletteActive:'Process',arenaActive:'return',arenaVisible:4,dialogTitle:'Process',fields:[['Name','Devolver artículo'],['Delay Type','Constant'],['Value','0.5'],['Units','Minutes']],activeField:'Value',ribbon:['0.5 min','delay constante','Value = 0.5'],note:'La cajera permanece ocupada durante este tiempo.'},
    {activeFact:2,techActive:'return',techVisible:3,paletteActive:'Resource',arenaActive:'return',arenaVisible:4,dialogTitle:'Devolver ARTICULO',fields:[['Resource','ARTICULO'],['Quantity returned','1']],activeField:'Quantity returned',sheetRows:[['ARTICULO','Resource','stock + 1']],ribbon:['artículo vuelve a vitrina','stock aumenta en 1','reincorporar 1 ARTICULO'],note:'Un recurso no reusable puede volver, pero solo por una acción explícita de devolución o reposición.'},
    {activeFact:3,techActive:'release',techVisible:4,paletteActive:'Release',arenaActive:'release',arenaVisible:5,ribbon:['fin de la interacción con la cajera','recurso vuelve a disponible','Release Cajera'],note:'Tanto la rama True como la False deben terminar liberando la cajera antes de envoltura.'}
  ]
});

/* 11 · Envoltura */
makeTriadSlide({
  title:'Envoltura', short:'2 señoritas', kicker:'11 · Último servicio',
  heading:'El tiempo de envoltura depende de <span class="highlight">CANTIDAD</span>',
  subtitle:'Una señorita envuelve todos los artículos de un cliente; dos clientes pueden envolverse en paralelo.',
  facts:[
    'hay dos señoritas para envolver',
    'cada una atiende a un cliente a la vez',
    'UNIF(1,2) minutos por cada artículo',
    'el cliente sale cuando todos sus artículos están envueltos'
  ],
  techNodes:[
    {id:'queue',label:'Cola de envoltura',type:'cola'},
    {id:'seize',label:'Tomar 1 Señorita',type:'seize'},
    {id:'delay',label:'CANTIDAD × UNIF(1,2)',type:'delay'},
    {id:'release',label:'Liberar Señorita',type:'release'}
  ],
  arenaFlow:[
    {id:'releaseCashier',label:'Liberar Cajera',kind:'process'},
    {id:'wrap',label:'Process · Solicitar envoltura',kind:'process'}
  ],
  steps:[
    {activeFact:0,techActive:'queue',techVisible:1,paletteActive:'Queue',arenaActive:'wrap',arenaVisible:2,sheetRows:[['Envolver.Queue','FIFO','—']],ribbon:['servicio de envoltura','cola propia','Queue de Envolver'],note:'La cola de envoltura es distinta de la cola de caja.'},
    {activeFact:0,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'wrap',arenaVisible:2,dialogTitle:'Process',fields:[['Name','Solicitar envoltura'],['Action','Seize Delay Release'],['Resource','Señorita'],['Quantity','1'],['Delay Type','Expression'],['Expression','CANTIDAD*UNIF(1,2)'],['Units','Minutes']],activeField:'Resource',sheetRows:[['Señorita','Resource','Capacity 2']],ribbon:['“dos señoritas”','recurso Señorita · cap. 2','Resource = Señorita'],note:'Cada cliente ocupa solo una señorita.'},
    {activeFact:1,techActive:'seize',techVisible:2,paletteActive:'Process',arenaActive:'wrap',arenaVisible:2,dialogTitle:'Process',fields:[['Resource','Señorita'],['Quantity','1']],activeField:'Quantity',ribbon:['“cada una… un cliente”','1 unidad por entidad','Quantity = 1'],note:'Con capacidad 2 pueden existir dos envolturas en paralelo.'},
    {activeFact:2,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'wrap',arenaVisible:2,dialogTitle:'Process',fields:[['Delay Type','Expression'],['Expression','CANTIDAD*UNIF(1,2)'],['Units','Minutes']],activeField:'Delay Type',ribbon:['tiempo depende de cantidad','necesitamos una expresión','Delay Type = Expression'],note:'Ya no basta una uniforme simple porque debemos multiplicar por el atributo.'},
    {activeFact:2,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'wrap',arenaVisible:2,dialogTitle:'Process',fields:[['Expression','CANTIDAD*UNIF(1,2)'],['Units','Minutes']],activeField:'Expression',builder:{expression:'CANTIDAD*UNIF(1,2)',paths:[['CANTIDAD','Current Model Variables and Functions → User-Defined Attribute'],['UNIF','Random Distributions']],tip:'Busca UNIF en Random Distributions y el atributo CANTIDAD en User-Defined Attribute; luego multiplícalos.'},ribbon:['“1–2 min por artículo”','CANTIDAD × UNIF(1,2)','Expression'],note:'Si el cliente devuelve un artículo, CANTIDAD ya fue reducida antes de llegar aquí.'},
    {activeFact:2,techActive:'delay',techVisible:3,paletteActive:'Process',arenaActive:'wrap',arenaVisible:2,dialogTitle:'Process',fields:[['Expression','CANTIDAD*UNIF(1,2)'],['Units','Minutes']],activeField:'Units',ribbon:['“minutos”','unidad del servicio','Units = Minutes'],note:'La expresión devuelve minutos.'},
    {activeFact:3,techActive:'release',techVisible:4,paletteActive:'Process',arenaActive:'wrap',arenaVisible:2,ribbon:['“se retira una vez envueltos”','termina actividad y libera recurso','Seize Delay Release'],note:'Aquí sí se puede liberar automáticamente a la señorita al final del Process.'}
  ]
});

/* 12 · Record + salida */
makeTriadSlide({
  title:'Medir y salir', short:'Record + Dispose', kicker:'12 · Indicadores del cliente',
  heading:'Lo que se pregunta al final debe <span class="highlight">medirse durante el modelo</span>',
  subtitle:'El .doe guarda el instante de llegada y usa un Record tipo Interval para el tiempo de permanencia.',
  facts:[
    'determinar el tiempo promedio que toma a un cliente hacer sus compras',
    'el cliente se retira al finalizar la envoltura'
  ],
  techNodes:[
    {id:'wrap',label:'Fin de envoltura',type:'fin actividad'},
    {id:'record',label:'Tiempo = TNOW − HoraLlegada',type:'medición'},
    {id:'dispose',label:'Cliente sale del sistema',type:'salida'}
  ],
  arenaFlow:[
    {id:'wrap',label:'Envolver',kind:'process'},
    {id:'record',label:'Record · Tpo permanencia compras',kind:'record'},
    {id:'dispose',label:'Dispose',kind:'dispose'}
  ],
  steps:[
    {activeFact:0,techActive:'wrap',techVisible:1,paletteActive:'Record',arenaActive:'record',arenaVisible:2,ribbon:['indicador de tiempo','necesitamos medir','Record'],note:'Los indicadores no aparecen por arte de magia al final: debemos instrumentar el modelo.'},
    {activeFact:0,techActive:'record',techVisible:2,paletteActive:'Record',arenaActive:'record',arenaVisible:2,dialogTitle:'Record',fields:[['Name','Record tiempo'],['Type','Interval'],['Attribute','HoraLlegada'],['Tally Name','Tpo permanencia compras']],activeField:'Type',ribbon:['tiempo desde llegada','intervalo hasta ahora','Type = Interval'],note:'Interval usa una marca de tiempo guardada previamente.'},
    {activeFact:0,techActive:'record',techVisible:2,paletteActive:'Record',arenaActive:'record',arenaVisible:2,dialogTitle:'Record',fields:[['Type','Interval'],['Attribute','HoraLlegada'],['Tally Name','Tpo permanencia compras']],activeField:'Attribute',ribbon:['HoraLlegada guardada en Assign','TNOW − HoraLlegada','Attribute = HoraLlegada'],note:'Ahora vemos por qué guardamos HoraLlegada al inicio.'},
    {activeFact:0,techActive:'record',techVisible:2,paletteActive:'Record',arenaActive:'record',arenaVisible:2,dialogTitle:'Record',fields:[['Type','Interval'],['Attribute','HoraLlegada'],['Tally Name','Tpo permanencia compras']],activeField:'Tally Name',sheetRows:[['Tpo permanencia compras','Tally','Average']],ribbon:['promedio solicitado','acumular observaciones','Tally = Tpo permanencia compras'],note:'Arena podrá reportar el promedio de todas las observaciones registradas.'},
    {activeFact:1,techActive:'dispose',techVisible:3,paletteActive:'Dispose',arenaActive:'dispose',arenaVisible:3,ribbon:['“cliente se retira”','fin de entidad','Dispose'],note:'Dispose elimina del sistema a la entidad que ya terminó.'}
  ]
});

/* 13 · Reposición */
makeTriadSlide({
  title:'Reposición de existencias', short:'Flujo paralelo', kicker:'13 · Stock objetivo 80',
  heading:'La reposición es un <span class="highlight">flujo de control separado</span>',
  subtitle:'Pedido, tiempo de entrega y aumento de capacidad ocurren independientemente del flujo de clientes.',
  facts:[
    'stock inicial: 80 artículos',
    'cada 3 horas se solicita lo necesario para volver a 80',
    'solo se harán dos reposiciones',
    'el pedido tarda UNIF(0.3,0.5) horas en llegar'
  ],
  techNodes:[
    {id:'trigger',label:'Cada 3 h · máximo 2 eventos',type:'evento'},
    {id:'order',label:'PEDIDO = 80 − stock actual',type:'cálculo'},
    {id:'lead',label:'Esperar UNIF(0.3,0.5) h',type:'lead time'},
    {id:'replenish',label:'Stock ← stock + PEDIDO',type:'reposición'}
  ],
  arenaFlow:[
    {id:'trigger',label:'Create · Lanzar reposición',kind:'create'},
    {id:'order',label:'Assign · PEDIDO',kind:'assign'},
    {id:'lead',label:'Delay · Tiempo de entrega',kind:'control'},
    {id:'replenish',label:'Assign · MR(ARTICULO)+PEDIDO',kind:'assign'},
    {id:'dispose',label:'Dispose · CONTROL',kind:'dispose'}
  ],
  steps:[
    {activeFact:0,techActive:'trigger',techVisible:1,paletteActive:'Resource',arenaActive:'trigger',arenaVisible:1,sheetRows:[['ARTICULO','Resource','Capacity 80']],ribbon:['“inicialmente 80”','objetivo / capacidad inicial','ARTICULO Capacity = 80'],note:'80 funciona como stock objetivo y capacidad inicial.'},
    {activeFact:1,techActive:'trigger',techVisible:1,paletteActive:'Create',arenaActive:'trigger',arenaVisible:1,dialogTitle:'Create',fields:[['Name','Lanzar reposición'],['Type','Constant'],['Value','3'],['Units','Hours'],['Max Arrivals','2'],['Entity Type','CONTROL']],activeField:'Name',ribbon:['“cada 3 horas”','evento periódico','Create de control'],note:'La reposición no la dispara un cliente.'},
    {activeFact:1,techActive:'trigger',techVisible:1,paletteActive:'Create',arenaActive:'trigger',arenaVisible:1,dialogTitle:'Create',fields:[['Type','Constant'],['Value','3'],['Units','Hours'],['Max Arrivals','2']],activeField:'Value',ribbon:['intervalo 3 h','periodicidad','Value = 3'],note:'Usamos horas porque el enunciado expresa este evento en horas.'},
    {activeFact:2,techActive:'trigger',techVisible:1,paletteActive:'Create',arenaActive:'trigger',arenaVisible:1,dialogTitle:'Create',fields:[['Type','Constant'],['Value','3'],['Units','Hours'],['Max Arrivals','2']],activeField:'Max Arrivals',ribbon:['“solo dos reposiciones”','dos eventos','Max Arrivals = 2'],note:'Después del segundo evento, el flujo de reposición deja de crear controles.'},
    {activeFact:1,techActive:'order',techVisible:2,paletteActive:'Assign',arenaActive:'order',arenaVisible:2,ribbon:['“lo necesario para volver a 80”','calcular faltante','Assign PEDIDO'],note:'PEDIDO es un atributo de la entidad CONTROL en el modelo suministrado.'},
    {activeFact:1,techActive:'order',techVisible:2,paletteActive:'Assign',arenaActive:'order',arenaVisible:2,dialogTitle:'Assign',fields:[['Attribute','PEDIDO'],['New Value','80 - (MR(ARTICULO)-NR(ARTICULO))']],activeField:'New Value',builder:{expression:'80 - (MR(ARTICULO)-NR(ARTICULO))',paths:[['MR','Current Model Variables and Functions → Resource'],['NR','Current Model Variables and Functions → Resource']],tip:'Primero calcula el stock disponible con MR-NR; luego resta ese valor a 80.'},ribbon:['volver a 80','80 − stock disponible','PEDIDO = 80 - (MR-NR)'],note:'Si hay 31 artículos disponibles al momento de pedir, PEDIDO = 49.'},
    {activeFact:3,techActive:'lead',techVisible:3,paletteActive:'Delay',arenaActive:'lead',arenaVisible:3,ribbon:['“llegada del pedido tarda…”','lead time','Delay'],note:'El stock puede seguir cambiando mientras el pedido está en tránsito.'},
    {activeFact:3,techActive:'lead',techVisible:3,paletteActive:'Delay',arenaActive:'lead',arenaVisible:3,dialogTitle:'Delay',fields:[['Name','Tiempo de entrega'],['Delay Type','Expression'],['Expression','UNIF(0.3,0.5)'],['Units','Hours']],activeField:'Expression',builder:{expression:'UNIF(0.3,0.5)',paths:[['UNIF','Random Distributions']],tip:'Recuerda cambiar también las Units a Hours para que la interpretación sea correcta.'},ribbon:['UNIF(0.3,0.5) h','tiempo de entrega','Expression = UNIF(0.3,0.5)'],note:'La unidad aquí es horas, como indica el enunciado.'},
    {activeFact:1,techActive:'replenish',techVisible:4,paletteActive:'Assign',arenaActive:'replenish',arenaVisible:4,ribbon:['pedido finalmente llega','aumentar capacidad disponible','MR(ARTICULO) + PEDIDO'],note:'La reposición es explícita: el inventario no reaparece solo.'},
    {activeFact:1,techActive:'replenish',techVisible:4,paletteActive:'Assign',arenaActive:'replenish',arenaVisible:4,dialogTitle:'Assign',fields:[['Other','MR(ARTICULO)'],['New Value','MR(ARTICULO) + PEDIDO']],activeField:'New Value',builder:{expression:'MR(ARTICULO) + PEDIDO',paths:[['MR','Current Model Variables and Functions → Resource'],['PEDIDO','Current Model Variables and Functions → User-Defined Attribute']],tip:'Para la reposición, toma la capacidad actual del recurso y súmale el atributo PEDIDO.'},sheetRows:[['PEDIDO','Attribute','80-stock'],['ARTICULO','Resource','MR + PEDIDO']],ribbon:['cantidad pedida','incrementar capacidad','MR(ARTICULO)=MR(ARTICULO)+PEDIDO'],note:'Esta expresión aparece en el modelo .doe suministrado.'},
    {activeFact:3,techActive:'replenish',techVisible:4,paletteActive:'Dispose',arenaActive:'dispose',arenaVisible:5,ribbon:['evento ya cumplido','terminar entidad de control','Dispose CONTROL'],note:'La entidad CONTROL solo existía para programar el evento de reposición.'}
  ]
});

/* 14 · Modelo completo + cross reference */
slides.push({
  title:'Modelo completo', short:'Mapa cruzado', steps:1,
  render(){
    const maps={
      llegadas:['Llegadas EXPO(8) / EXPO(12)','Llegada + cambio temporal','Create + Variable MEDIA'],
      cantidad:['Cantidad 2–4','Atributo CANTIDAD','Assign'],
      stock:['Si no hay suficientes, se retira','Decide Stock ≥ CANTIDAD','Decide'],
      seleccionar:['UNIF(10,20)','Consumir ARTICULO','Process Seleccionar'],
      caja:['2 cajeras · TRIA(1,3,5)','Cola + recurso Cajera','Process Pagar'],
      devolver:['10% devuelve 1','Decisión + devolver stock','Decide + Assign + Process'],
      envolver:['2 señoritas · 1–2 min/artículo','Servicio de envoltura','Process Envolver'],
      reposicion:['Cada 3 h volver a 80','Flujo paralelo de inventario','Create + Assign + Delay'],
      medir:['Tiempo promedio + stock final','Medición','Record + Resource']
    };
    const m=maps[crossFocus];
    return `
      <div class="slide-kicker">14 · Modelo completo</div>
      <h2 class="slide-title">Haz clic y sigue la misma idea en <span class="highlight">las tres capas</span></h2>
      <p class="slide-subtitle">Esta slide funciona como mapa de repaso antes de ejecutar el modelo.</p>
      <div class="cross-map">${Object.entries(maps).map(([k,v])=>`<button type="button" class="cross-card ${k===crossFocus?'active':''}" data-cross="${k}"><strong>${v[1]}</strong><span>${v[0]}</span></button>`).join('')}</div>
      ${ribbon(m[0],m[1],m[2])}
      <div class="grid-2" style="margin-top:10px">
        <div class="card"><h3>Flujo principal</h3><div class="tech-flow">
          ${['Llegada','Assign CANTIDAD/Hora','¿Stock?','Seleccionar','Pagar','¿Devuelve?','Liberar cajera','Envolver','Record','Dispose'].map((x,i)=>`<div class="tech-node done">${x}</div>${i<9?'<div class="tech-arrow">↓</div>':''}`).join('')}
        </div></div>
        <div class="card"><h3>Flujo paralelo de reposición</h3><div class="tech-flow">
          ${['Cada 3 h','Calcular PEDIDO','Esperar entrega','Aumentar ARTICULO','Dispose CONTROL'].map((x,i)=>`<div class="tech-node done">${x}</div>${i<4?'<div class="tech-arrow">↓</div>':''}`).join('')}
        </div></div>
      </div>`;
  }
});

/* 15 · Simulador */
const simEvents=[
  {t:'10:00',node:'Llegada',stock:80,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso A · Cliente #1 llega. CANTIDAD=3.'},
  {t:'10:00',node:'¿Stock?',stock:80,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso A · 80 ≥ 3 → TRUE. El cliente sí puede comprar.'},
  {t:'10:00',node:'Seleccionar',stock:77,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso A · Toma 3 ARTICULO. Stock 80→77.'},
  {t:'10:15',node:'Pagar',stock:77,cq:0,wq:0,cBusy:1,wBusy:0,msg:'Caso A · Ocupa una cajera.'},
  {t:'10:18',node:'¿Devuelve?',stock:77,cq:0,wq:0,cBusy:1,wBusy:0,msg:'Caso A · Decide devolución → TRUE (para mostrar esta rama).'},
  {t:'10:18:30',node:'Devolver',stock:78,cq:0,wq:0,cBusy:1,wBusy:0,msg:'Caso A · Devuelve 1 artículo. CANTIDAD 3→2. Stock 77→78.'},
  {t:'10:18:30',node:'Liberar cajera',stock:78,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso A · La cajera vuelve a libre.'},
  {t:'10:18:30',node:'Envolver',stock:78,cq:0,wq:0,cBusy:0,wBusy:1,msg:'Caso A · Una señorita envuelve 2 artículos.'},
  {t:'10:21:10',node:'Record',stock:78,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso A · Se registra TNOW−HoraLlegada y el cliente sale.'},
  {t:'12:55',node:'Llegada',stock:4,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso B · Cliente #2 llega. CANTIDAD=6, pero el stock ya está bajo.'},
  {t:'12:55',node:'¿Stock?',stock:4,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso B · 4 ≥ 6 → FALSE. Se activa la rama de retiro descontento.'},
  {t:'12:55',node:'Record',stock:4,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso B · El cliente sale por la rama FALSE del stock (Dispose 2).'},
  {t:'13:00',node:'Reposición',stock:31,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso C · Se dispara el evento de reposición. PEDIDO=49.'},
  {t:'13:24',node:'Pedido en tránsito',stock:24,cq:1,wq:0,cBusy:1,wBusy:1,msg:'Caso C · Mientras el pedido viaja, el sistema sigue operando y el stock baja a 24.'},
  {t:'13:24',node:'Reponer',stock:73,cq:1,wq:0,cBusy:1,wBusy:1,msg:'Caso C · Llega PEDIDO=49. Stock disponible 24→73.'},
  {t:'13:30',node:'Llegada',stock:73,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso D · Cliente #3 llega. CANTIDAD=4.'},
  {t:'13:30',node:'¿Stock?',stock:73,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso D · 73 ≥ 4 → TRUE.'},
  {t:'13:30',node:'Seleccionar',stock:69,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso D · Toma 4 artículos. Stock 73→69.'},
  {t:'13:44',node:'Pagar',stock:69,cq:0,wq:0,cBusy:1,wBusy:0,msg:'Caso D · Pasa por caja.'},
  {t:'13:47',node:'¿Devuelve?',stock:69,cq:0,wq:0,cBusy:1,wBusy:0,msg:'Caso D · Decide devolución → FALSE.'},
  {t:'13:47',node:'Liberar cajera',stock:69,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso D · No devuelve; solo libera la cajera.'},
  {t:'13:47',node:'Envolver',stock:69,cq:0,wq:0,cBusy:0,wBusy:1,msg:'Caso D · Envoltura de 4 artículos.'},
  {t:'13:52',node:'Record',stock:69,cq:0,wq:0,cBusy:0,wBusy:0,msg:'Caso D · Se registra la permanencia y termina la trayectoria por la rama FALSE del segundo Decide.'}
];
slides.push({
  title:'Ejecución docente', short:'Simulador', steps:1,
  render(){ return renderSimulator(); }
});
function renderSimulator(){
  const e=simEvents[simIndex] || simEvents[0];
  return `
    <div class="slide-kicker">15 · Mini simulación docente</div>
    <h2 class="slide-title">Ahora observa el modelo <span class="highlight">en movimiento dentro de Arena</span></h2>
    <p class="slide-subtitle">Secuencia controlada para explicar estados, rutas TRUE/FALSE y reposición. Incluye anotaciones dentro de la interfaz.</p>
    ${renderArenaSimulator(e)}`;
}

/* 16 · Indicadores */
slides.push({
  title:'Cómo obtener los indicadores', short:'Resultados', steps:7,
  render(step){
    const rows=[
      ['Pregunta','Tiempo promedio que toma a un cliente hacer sus compras'],
      ['Dato guardado','HoraLlegada = TNOW al entrar'],
      ['Medición','Record · Type Interval · Attribute HoraLlegada'],
      ['Reporte','Tally: Tpo permanencia compras → Average'],
      ['Pregunta','Contenido final de la vitrina'],
      ['Cálculo','MR(ARTICULO) - NR(ARTICULO)'],
      ['Importante','El material no proporciona un valor numérico final para la tienda de regalos; depende de la corrida.']
    ];
    const reveal=Math.min(step+1,rows.length);
    return `
      <div class="slide-kicker">16 · Resultados solicitados</div>
      <h2 class="slide-title">Cada indicador debe tener una <span class="highlight">trazabilidad</span></h2>
      <div class="grid-2">
        <div class="trace-panel">${rows.slice(0,reveal).map((r,i)=>`<div class="card ${i===reveal-1?'accent-card fade-in':''}"><h3>${r[0]}</h3><p>${r[1]}</p></div>`).join('')}</div>
        <div class="card good-card"><h3>Cadena de medición</h3>
          <div class="tech-flow">
            <div class="tech-node done">Pregunta del ejercicio</div><div class="tech-arrow">↓</div>
            <div class="tech-node done">Variable / atributo necesario</div><div class="tech-arrow">↓</div>
            <div class="tech-node done">Record / Resource report</div><div class="tech-arrow">↓</div>
            <div class="tech-node active">Resultado de la corrida</div>
          </div>
        </div>
      </div>`;
  }
});

/* 17 · Escenario extra del DOE */
makeTriadSlide({
  title:'Escenario extra · personal de envoltura', short:'Cambio de capacidad', kicker:'17 · Archivo Tienda de regalos ESC',
  heading:'La capacidad también puede <span class="highlight">cambiar con el tiempo</span>',
  subtitle:'El escenario suministrado plantea una señorita a las 12:00 y la segunda 30 minutos después.',
  facts:[
    'una señorita llega a la tienda a las 12:00',
    'la otra llega 30 minutos después',
    'la capacidad de envoltura debe aumentar cuando llega cada una'
  ],
  techNodes:[
    {id:'event1',label:'12:00 → +1 Señorita',type:'evento temporal'},
    {id:'wait',label:'Esperar 30 min',type:'delay'},
    {id:'event2',label:'12:30 → +1 Señorita',type:'evento temporal'}
  ],
  arenaFlow:[
    {id:'trigger',label:'Create · Lanzar llegada de señorita',kind:'create'},
    {id:'add1',label:'Assign · MR(Señorita)+1',kind:'assign'},
    {id:'wait',label:'Delay · 30 min',kind:'control'},
    {id:'add2',label:'Assign · MR(Señorita)+1',kind:'assign'},
    {id:'dispose',label:'Dispose CONTROL',kind:'dispose'}
  ],
  steps:[
    {activeFact:0,techActive:'event1',techVisible:1,paletteActive:'Create',arenaActive:'arriveLady',arenaVisible:1,activeTab:'Tienda de regalos ESC',diagram:'esc',ribbon:['“llega a las 12”','evento a hora específica','Create de control'],note:'La capacidad ya no es fija desde la apertura.'},
    {activeFact:0,techActive:'event1',techVisible:1,paletteActive:'Assign',arenaActive:'add1',arenaVisible:2,activeTab:'Tienda de regalos ESC',diagram:'esc',dialogTitle:'Assign',fields:[['Other','MR(Señorita)'],['New Value','MR(Señorita) + 1']],activeField:'New Value',builder:{expression:'MR(Señorita) + 1',paths:[['MR','Current Model Variables and Functions → Resource']],tip:'La capacidad del recurso se manipula a través de MR(ResourceName).'},ribbon:['primera señorita llega','capacidad +1','MR(Señorita)+1'],note:'El archivo ESC usa un Assign sobre la capacidad del recurso.'},
    {activeFact:1,techActive:'wait',techVisible:2,paletteActive:'Delay',arenaActive:'wait',arenaVisible:3,activeTab:'Tienda de regalos ESC',diagram:'esc',dialogTitle:'Delay',fields:[['Name','Pasan 30 min'],['Value','0.5'],['Units','Hours']],activeField:'Value',ribbon:['“30 minutos después”','esperar media hora','Delay 0.5 h'],note:'El control espera antes de aumentar nuevamente la capacidad.'},
    {activeFact:1,techActive:'event2',techVisible:3,paletteActive:'Assign',arenaActive:'add2',arenaVisible:4,activeTab:'Tienda de regalos ESC',diagram:'esc',dialogTitle:'Assign',fields:[['Other','MR(Señorita)'],['New Value','MR(Señorita) + 1']],activeField:'New Value',builder:{expression:'MR(Señorita) + 1',paths:[['MR','Current Model Variables and Functions → Resource']],tip:'Se repite exactamente la misma lógica del primer incremento.'},ribbon:['segunda señorita','capacidad +1 nuevamente','MR(Señorita)+1'],note:'A partir de 12:30 hay dos unidades disponibles del recurso.'},
    {activeFact:2,techActive:'event2',techVisible:3,paletteActive:'Dispose',arenaActive:'dispose6',arenaVisible:5,activeTab:'Tienda de regalos ESC',diagram:'esc',ribbon:['evento completado','fin del control','Dispose'],note:'La entidad de control ya cumplió su función.'}
  ]
});

/* 18 · Llaveritos: extraer cambios */
slides.push({
  title:'Tienda de llaveritos', short:'Segundo caso', steps:9,
  render(step){
    const facts=[
      ['Turistas','Llegan de uno en uno con EXPO(1.5 min), incluido el primero.'],
      ['Bus escolar','Entre 11:00 y 12:00 llega un bus con 120 escolares.'],
      ['Compra','Cada persona compra entre 6 y 10 llaveritos con igual probabilidad.'],
      ['Selección','5 segundos por cada llaverito.'],
      ['Caja','Una cola; 3 cajeros; TRIA(0.25,0.5,1.5) min.'],
      ['Refuerzo','Desde 11:00 llegan 2 cajeros extra; se van a las 15:00.'],
      ['Stock inicial','A las 9:00 hay 900 llaveritos.'],
      ['Reposición','A las 11:00 llegan 900; después llegan 450 cada hora.'],
      ['Horizonte','Simular 10 horas, unidades base en minutos.']
    ];
    const arena=['Create turistas','Create bus + Batch 120','Assign CANTIDAD','Process selección','Process pago + Cajero','Cambios de Capacity','Resource LLAVERO','Flujo de reposición','Replication Length'];
    return `
      <div class="slide-kicker">18 · Otra aplicación práctica</div>
      <h2 class="slide-title">¿Qué podemos <span class="highlight">reutilizar</span> del modelo anterior?</h2>
      <div class="triad-grid">
        <section class="triad-panel"><div class="triad-head problem"><span>Texto del caso</span><span>ORIGEN</span></div><div class="triad-body">${sourcePanel(facts.map(x=>x[1]),step,'CASO LLAVERITOS')}</div></section>
        <section class="triad-panel"><div class="triad-head tech"><span>Dibujo técnico</span><span>CAMBIO</span></div><div class="triad-body"><div class="card accent-card"><h3>${facts[step][0]}</h3><p>${facts[step][1]}</p></div><div class="step-callout"><strong>Comparación</strong><span>${step===0?'Mismo patrón de llegadas aleatorias, pero nueva media.':step===1?'Aparece una llegada masiva adicional.':step===5?'La capacidad del recurso cambia con el reloj.':step===7?'La reposición ya no es “volver a 80”; ahora son cantidades fijas programadas.':'Reutiliza el patrón conceptual adecuado del caso anterior.'}</span></div></div></section>
        <section class="triad-panel"><div class="triad-head arena"><span>Arena</span><span>IMPLEMENTACIÓN</span></div><div class="triad-body">${arenaView({paletteActive:arena[step].split(' ')[0],flow:[{id:'x',label:arena[step],kind:step===1?'create':step===5?'control':'process'}],activeModule:'x',visibleCount:1,dialogTitle:'Traducción propuesta',fields:[['Necesidad',facts[step][0]],['Arena',arena[step]]],activeField:'Arena'})}</div></section>
      </div>
      ${ribbon(facts[step][1],facts[step][0],arena[step])}`;
  }
});

/* 19 · Llaveritos: resultados del material */
slides.push({
  title:'Llaveritos · resultados de referencia', short:'Resultados fuente', steps:4,
  render(step){
    const data=[
      ['Desabastecimiento','Sí; el material reporta espera y cola distintas de cero en Seleccionar llaveros.'],
      ['Cola de selección','WaitingTime = 0.43301 min; NumberInQueue = 0.37744 clientes.'],
      ['Llaveros vendidos','Escolares: 970. Turistas: 3194.'],
      ['Tiempo hasta seleccionar','Promedio: 1.0964 min, medido con Record tipo Time Interval.']
    ];
    const reveal=Math.min(step+1,data.length);
    return `
      <div class="slide-kicker">19 · Resultados mostrados en el material</div>
      <h2 class="slide-title">No solo el valor: <span class="highlight">¿cómo se obtuvo?</span></h2>
      <div class="grid-2">
        <div class="trace-panel">${data.slice(0,reveal).map((x,i)=>`<div class="card ${i===reveal-1?'accent-card fade-in':''}"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>
        <div class="card good-card"><h3>Regla de lectura de reportes</h3><p>Indicador pedido → estadístico/módulo que lo mide → valor y unidades → interpretación operacional.</p></div>
      </div>`;
  }
});

/* 20 · Cierre */
slides.push({
  title:'Cierre', short:'Checklist', steps:7,
  render(step){
    const items=[
      ['1','¿Cuál es la entidad que fluye?'],
      ['2','¿Qué atributos necesita llevar consigo?'],
      ['3','¿Qué recursos se liberan y cuáles se consumen?'],
      ['4','¿Qué frase produce cada Decide?'],
      ['5','¿Qué eventos ocurren por reloj y no por llegada de clientes?'],
      ['6','¿Cómo se calcula el stock disponible?'],
      ['7','¿Qué Record o reporte responde cada indicador?']
    ];
    const reveal=Math.min(step+1,items.length);
    return `
      <div class="slide-kicker">20 · Para finalizar</div>
      <h2 class="slide-title">Antes de abrir Arena, responde estas <span class="highlight">7 preguntas</span></h2>
      <div class="grid-3">${items.slice(0,reveal).map((x,i)=>`<div class="card ${i===reveal-1?'accent-card fade-in':''}"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>
      ${reveal===items.length?`<div class="step-callout"><strong>Dos preguntas del material</strong><span>¿Cómo modelar una reposición cuando no te dan la cantidad exacta? ¿Cómo calcular el stock de un recurso? → usa el estado actual del recurso para construir la expresión de reposición y stock.</span></div>`:''}`;
  }
});

function buildNav(){
  slideNav.innerHTML=slides.map((s,i)=>`
    <button class="nav-item ${i===currentSlide?'active':''}" onclick="goSlide(${i})">
      <span class="nav-number">${i+1}</span>
      <span class="nav-copy"><strong>${s.title}</strong><span>${s.short}</span></span>
    </button>`).join('');
}
function clearSimTimer(){ if(simTimer){ clearInterval(simTimer); simTimer=null; } }
function render(){
  const s=slides[currentSlide];
  const maxStep=Math.max(1,s.steps);
  currentStep=Math.max(0,Math.min(currentStep,maxStep-1));
  slideEl.innerHTML=`<div class="micro-tag">Slide ${currentSlide+1} · Micro-paso ${currentStep+1}/${maxStep}</div>${s.render(currentStep)}`;
  progressBar.style.width=`${((currentStep+1)/maxStep)*100}%`;
  progressText.textContent=`Slide ${currentSlide+1} de ${slides.length} · Paso ${currentStep+1} de ${maxStep}`;
  buildNav();
  btnPrevStep.disabled=currentStep===0;
  btnNextStep.textContent=currentStep===maxStep-1?'Slide siguiente →':'Siguiente paso →';
  btnPrevSlide.disabled=currentSlide===0;
  btnNextSlide.disabled=currentSlide===slides.length-1;
  afterRender();
}
function afterRender(){
  document.querySelectorAll('[data-cross]').forEach(btn=>btn.addEventListener('click',()=>{crossFocus=btn.dataset.cross;render();}));
  const next=document.getElementById('simNext');
  if(next){
    document.getElementById('simNext').addEventListener('click',()=>{simIndex=Math.min(simEvents.length-1,simIndex+1);render();});
    document.getElementById('simPrev').addEventListener('click',()=>{simIndex=Math.max(0,simIndex-1);render();});
    document.getElementById('simReset').addEventListener('click',()=>{clearSimTimer();simIndex=0;render();});
    document.getElementById('simPause').addEventListener('click',()=>clearSimTimer());
    document.getElementById('simRun').addEventListener('click',()=>{
      clearSimTimer();
      simTimer=setInterval(()=>{
        if(currentSlide!==14){clearSimTimer();return;}
        if(simIndex>=simEvents.length-1){clearSimTimer();return;}
        simIndex++;render();
      },900);
    });
  }
}
function nextStep(){ const s=slides[currentSlide]; clearSimTimer(); if(currentStep<s.steps-1) currentStep++; else if(currentSlide<slides.length-1){currentSlide++;currentStep=0;} render(); }
function prevStep(){ clearSimTimer(); if(currentStep>0) currentStep--; else if(currentSlide>0){currentSlide--;currentStep=slides[currentSlide].steps-1;} render(); }
function nextSlide(){ clearSimTimer(); if(currentSlide<slides.length-1){currentSlide++;currentStep=0;render();} }
function prevSlide(){ clearSimTimer(); if(currentSlide>0){currentSlide--;currentStep=0;render();} }
function goSlide(i){ clearSimTimer(); currentSlide=i;currentStep=0;render(); }
function restartSlide(){ clearSimTimer(); currentStep=0; if(currentSlide===14) simIndex=0; render(); }
function toggleFullscreen(){ if(!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }

btnNextStep.addEventListener('click',nextStep);
btnPrevStep.addEventListener('click',prevStep);
btnNextSlide.addEventListener('click',nextSlide);
btnPrevSlide.addEventListener('click',prevSlide);
document.getElementById('btnHelp').addEventListener('click',()=>helpDialog.showModal());
document.getElementById('btnCloseHelp').addEventListener('click',()=>helpDialog.close());
document.getElementById('btnFullscreen').addEventListener('click',toggleFullscreen);

document.addEventListener('keydown',(e)=>{
  if(helpDialog.open && e.key!=='Escape') return;
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
  if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();nextStep();}
  else if(e.key==='ArrowLeft'){e.preventDefault();prevStep();}
  else if(e.key==='ArrowDown'){e.preventDefault();nextSlide();}
  else if(e.key==='ArrowUp'){e.preventDefault();prevSlide();}
  else if(e.key.toLowerCase()==='f') toggleFullscreen();
  else if(e.key.toLowerCase()==='r') restartSlide();
});

render();
