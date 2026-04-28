import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'public', 'assets', 'imagery');

mkdirSync(outDir, { recursive: true });

const palette = {
  paper: '#f6f2ea',
  paperAlt: '#f1efe7',
  mist: '#e8ece8',
  haze: '#d7e0df',
  lime: '#ccff4d',
  limeSoft: '#defa93',
  ink: '#16171b',
  slate: '#73767f',
  sand: '#d5c6b0',
  rose: '#d9b9b0',
  blue: '#b8d9f4',
  teal: '#9fc9c6',
  tunedRed: '#ff5f5f',
  pink: '#f5aad1',
  sharpBlue: '#594dff',
  orange: '#fec20d',
  everyGreen: '#979441',
  appleGreen: '#99ff73',
  lavender: '#ccccff',
  yellow: '#ffff00',
};

function attrs(input) {
  return Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${String(value)}"`)
    .join(' ');
}

function rect(options) {
  return `<rect ${attrs(options)} />`;
}

function circle(options) {
  return `<circle ${attrs(options)} />`;
}

function line(options) {
  return `<line ${attrs(options)} />`;
}

function path(options) {
  return `<path ${attrs(options)} />`;
}

function group(content, options = {}) {
  return `<g ${attrs(options)}>${content}</g>`;
}

function repeatSequence(values, count) {
  return Array.from({ length: count }, (_, index) => values[index % values.length]);
}

function rotateTransform(rotate, cx, cy) {
  return rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined;
}

function card(x, y, width, height, options = {}) {
  const {
    fill = '#ffffff',
    stroke = palette.ink,
    strokeOpacity = 0.18,
    strokeWidth = 2,
    radius = 24,
    rotate = 0,
    opacity = 1,
  } = options;
  const transform = rotate ? `rotate(${rotate} ${x + width / 2} ${y + height / 2})` : undefined;
  return rect({
    x,
    y,
    width,
    height,
    rx: radius,
    fill,
    stroke,
    'stroke-width': strokeWidth,
    'stroke-opacity': strokeOpacity,
    opacity,
    transform,
  });
}

function chip(x, y, width, height, fill = palette.lime, rotate = 0) {
  const transform = rotate ? `rotate(${rotate} ${x + width / 2} ${y + height / 2})` : undefined;
  return rect({ x, y, width, height, rx: height / 2, fill, transform });
}

function outlineRule(x, y, width, opacity = 0.25) {
  return rect({
    x,
    y,
    width,
    height: 2,
    rx: 1,
    fill: palette.ink,
    opacity,
  });
}

function orb(cx, cy, r, fill = palette.lime, opacity = 0.82) {
  return circle({ cx, cy, r, fill, opacity });
}

function dotGrid(x, y, cols, rows, gap, color, opacity = 0.35) {
  let output = '';
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      output += circle({
        cx: x + col * gap,
        cy: y + row * gap,
        r: 1.8,
        fill: color,
        opacity,
      });
    }
  }
  return output;
}

function frameLines(x, y, width, height, color = palette.ink, opacity = 0.18) {
  return [
    outlineRule(x, y + height + 18, width * 0.58, opacity),
    outlineRule(x, y + height + 46, width * 0.34, opacity * 0.75),
  ].join('');
}

function browserFrame(x, y, width, height, options = {}) {
  const {
    fill = '#ffffff',
    chrome = palette.paperAlt,
    strokeOpacity = 0.16,
    radius = 24,
  } = options;

  return [
    card(x, y, width, height, { fill, strokeOpacity, radius }),
    rect({ x: x + 2, y: y + 2, width: width - 4, height: 26, rx: Math.max(14, radius - 6), fill: chrome, opacity: 0.96 }),
    circle({ cx: x + 18, cy: y + 15, r: 3.5, fill: palette.ink, opacity: 0.12 }),
    circle({ cx: x + 30, cy: y + 15, r: 3.5, fill: palette.ink, opacity: 0.12 }),
    circle({ cx: x + 42, cy: y + 15, r: 3.5, fill: palette.ink, opacity: 0.12 }),
  ].join('');
}

function stripeTile(x, y, size, colors, options = {}) {
  const { rotate = 0, orientation = 'horizontal' } = options;
  const band = size / colors.length;
  let content = '';

  colors.forEach((fill, index) => {
    if (orientation === 'vertical') {
      content += rect({ x: x + band * index, y, width: band + 0.25, height: size, fill });
    } else {
      content += rect({ x, y: y + band * index, width: size, height: band + 0.25, fill });
    }
  });

  return group(content, { transform: rotateTransform(rotate, x + size / 2, y + size / 2) });
}

function pinwheelTile(x, y, size, colors, rotate = 0) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const [top, right, bottom, left] = colors;
  return group(
    [
      path({ d: `M${cx} ${cy} L${x} ${y} L${x + size} ${y} Z`, fill: top }),
      path({ d: `M${cx} ${cy} L${x + size} ${y} L${x + size} ${y + size} Z`, fill: right }),
      path({ d: `M${cx} ${cy} L${x + size} ${y + size} L${x} ${y + size} Z`, fill: bottom }),
      path({ d: `M${cx} ${cy} L${x} ${y + size} L${x} ${y} Z`, fill: left }),
    ].join(''),
    { transform: rotateTransform(rotate, cx, cy) }
  );
}

function diagonalCutTile(x, y, size, colors, rotate = 0) {
  const [base, slash, accent] = colors;
  return group(
    [
      rect({ x, y, width: size, height: size, fill: base }),
      path({
        d: `M${x} ${y + size * 0.82} L${x + size * 0.82} ${y} L${x + size} ${y} L${x} ${y + size} Z`,
        fill: slash,
      }),
      path({
        d: `M${x + size * 0.56} ${y} L${x + size} ${y} L${x + size} ${y + size * 0.44} Z`,
        fill: accent,
      }),
    ].join(''),
    { transform: rotateTransform(rotate, x + size / 2, y + size / 2) }
  );
}

function cornerBladesTile(x, y, size, colors, rotate = 0) {
  const [base, bladeA, bladeB, bladeC] = colors;
  return group(
    [
      rect({ x, y, width: size, height: size, fill: base }),
      path({
        d: `M${x + size} ${y} L${x + size * 0.58} ${y} L${x + size * 0.84} ${y + size * 0.42} L${x + size} ${y + size * 0.3} Z`,
        fill: bladeA,
      }),
      path({
        d: `M${x + size * 0.7} ${y} L${x + size * 0.36} ${y} L${x + size * 0.64} ${y + size * 0.48} L${x + size * 0.9} ${y + size * 0.38} Z`,
        fill: bladeB,
      }),
      path({
        d: `M${x + size * 0.44} ${y} L${x + size * 0.1} ${y} L${x + size * 0.44} ${y + size * 0.52} L${x + size * 0.7} ${y + size * 0.42} Z`,
        fill: bladeC,
      }),
    ].join(''),
    { transform: rotateTransform(rotate, x + size / 2, y + size / 2) }
  );
}

function background(config) {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${config.bgStart}" />
        <stop offset="100%" stop-color="${config.bgEnd}" />
      </linearGradient>
    </defs>
    ${rect({ x: 0, y: 0, width: 400, height: 300, rx: 30, fill: 'url(#bg)' })}
    ${rect({ x: 1, y: 1, width: 398, height: 298, rx: 29, fill: 'none', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
  `;
}

function compose(config) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
      ${background(config)}
      ${config.scene}
    </svg>
  `.trim();
}

const images = {
  'signal-stack': compose({
    bgStart: palette.paper,
    bgEnd: '#f8f8f2',
    scene: `
      ${card(42, 42, 210, 150, { fill: palette.paperAlt })}
      ${card(72, 58, 102, 84, { fill: '#ffffff', rotate: -4 })}
      ${card(96, 76, 108, 82, { fill: '#f9faf7', rotate: 4 })}
      ${card(144, 54, 172, 148, { fill: '#edf1ef' })}
      ${card(250, 146, 86, 106, { fill: '#ffffff', rotate: 6 })}
      ${orb(302, 78, 40)}
      ${chip(42, 220, 92, 14)}
      ${frameLines(42, 42, 210, 150)}
      ${dotGrid(262, 58, 7, 6, 12, palette.ink, 0.12)}
    `,
  }),
  'lime-archive': compose({
    bgStart: '#f5f0e8',
    bgEnd: '#eef1ea',
    scene: `
      ${card(34, 42, 286, 162, { fill: '#f7f4ed' })}
      ${card(52, 62, 78, 96, { fill: '#ffffff', rotate: -8 })}
      ${card(142, 60, 82, 106, { fill: '#faf9f5', rotate: 4 })}
      ${card(232, 54, 64, 86, { fill: '#ffffff', rotate: -2 })}
      ${rect({ x: 208, y: 84, width: 116, height: 10, rx: 5, fill: palette.sand })}
      ${path({ d: 'M90 190 C110 166 136 144 170 122 C210 96 252 92 310 100', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 2, fill: 'none' })}
      ${orb(278, 74, 38)}
      ${chip(34, 222, 108, 14)}
      ${card(240, 162, 86, 102, { fill: '#ffffff', rotate: 7 })}
      ${frameLines(34, 42, 286, 162)}
    `,
  }),
  'services-showcase': compose({
    bgStart: '#f4efe6',
    bgEnd: '#edf2ee',
    scene: `
      ${browserFrame(30, 38, 256, 186, { fill: '#faf8f2', chrome: '#ebe2d2' })}
      ${rect({ x: 52, y: 80, width: 82, height: 12, rx: 6, fill: palette.ink, opacity: 0.08 })}
      ${rect({ x: 52, y: 104, width: 120, height: 64, rx: 18, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.1, 'stroke-width': 2 })}
      ${rect({ x: 184, y: 104, width: 80, height: 28, rx: 14, fill: palette.limeSoft, stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${rect({ x: 184, y: 142, width: 80, height: 26, rx: 13, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${path({ d: 'M74 190 C106 162 142 144 180 130 C214 118 244 102 280 76', stroke: palette.ink, 'stroke-opacity': 0.22, 'stroke-width': 3, fill: 'none' })}
      ${path({ d: 'M270 72 L288 76 L280 92', stroke: palette.ink, 'stroke-opacity': 0.3, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })}
      ${orb(320, 74, 44)}
      ${card(272, 154, 86, 92, { fill: palette.ink, strokeOpacity: 0, rotate: -6 })}
      ${chip(290, 178, 48, 10)}
      ${outlineRule(288, 204, 38, 0.28)}
      ${outlineRule(288, 224, 28, 0.2)}
      ${dotGrid(312, 98, 4, 5, 12, palette.ink, 0.14)}
    `,
  }),
  'seo-grid': compose({
    bgStart: '#f4efe7',
    bgEnd: '#eef2ec',
    scene: `
      ${browserFrame(34, 40, 238, 182, { fill: '#fbfaf6', chrome: '#e9e1d4' })}
      ${rect({ x: 56, y: 82, width: 108, height: 12, rx: 6, fill: palette.ink, opacity: 0.08 })}
      ${chip(56, 104, 74, 12)}
      ${outlineRule(56, 128, 82, 0.16)}
      ${outlineRule(56, 150, 64, 0.12)}
      ${rect({ x: 184, y: 78, width: 68, height: 114, rx: 20, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.12, 'stroke-width': 2 })}
      ${outlineRule(200, 102, 36, 0.14)}
      ${chip(200, 122, 24, 8, palette.lime)}
      ${outlineRule(200, 142, 42, 0.16)}
      ${outlineRule(200, 162, 30, 0.12)}
      ${path({ d: 'M74 186 C102 160 122 148 144 138 C170 126 192 114 226 84', stroke: palette.ink, 'stroke-opacity': 0.26, 'stroke-width': 3, fill: 'none' })}
      ${path({ d: 'M216 82 L234 86 L228 102', stroke: palette.ink, 'stroke-opacity': 0.28, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })}
      ${orb(314, 66, 44)}
      ${card(278, 158, 84, 90, { fill: palette.ink, strokeOpacity: 0, rotate: -7 })}
      ${chip(294, 184, 46, 10)}
      ${outlineRule(294, 208, 34, 0.26)}
      ${outlineRule(294, 226, 24, 0.18)}
    `,
  }),
  'speed-burst': compose({
    bgStart: '#f6f0e8',
    bgEnd: '#eef2ef',
    scene: `
      ${card(32, 44, 236, 186, { fill: '#fbfaf4' })}
      ${path({ d: 'M72 176 A74 74 0 0 1 220 176', stroke: palette.ink, 'stroke-opacity': 0.14, 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round' })}
      ${path({ d: 'M72 176 A74 74 0 0 1 180 112', stroke: palette.lime, 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round', opacity: 0.92 })}
      ${circle({ cx: 146, cy: 176, r: 14, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.12, 'stroke-width': 2 })}
      ${path({ d: 'M146 176 L206 126', stroke: palette.ink, 'stroke-opacity': 0.3, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' })}
      ${rect({ x: 58, y: 78, width: 92, height: 10, rx: 5, fill: palette.ink, opacity: 0.08 })}
      ${rect({ x: 58, y: 98, width: 66, height: 10, rx: 5, fill: palette.ink, opacity: 0.06 })}
      ${group(
        [
          rect({ x: 0, y: 0, width: 132, height: 16, rx: 8, fill: palette.lime }),
          rect({ x: 18, y: 30, width: 144, height: 12, rx: 6, fill: palette.ink, opacity: 0.08 }),
          rect({ x: 48, y: 58, width: 116, height: 10, rx: 5, fill: palette.blue, opacity: 0.75 }),
        ].join(''),
        { transform: 'translate(186 86) rotate(-12)' }
      )}
      ${orb(314, 68, 42)}
      ${card(276, 164, 82, 84, { fill: palette.ink, strokeOpacity: 0, rotate: 8 })}
      ${chip(292, 190, 44, 10)}
    `,
  }),
  'image-pipeline': compose({
    bgStart: '#f7f2ea',
    bgEnd: '#edf2ee',
    scene: `
      ${browserFrame(26, 54, 94, 132, { fill: '#faf8f2', chrome: '#e9dfd0' })}
      ${browserFrame(152, 76, 96, 110, { fill: '#ffffff', chrome: '#ece5d8' })}
      ${browserFrame(278, 42, 96, 144, { fill: '#eef1ee', chrome: '#dee7e2' })}
      ${rect({ x: 44, y: 96, width: 58, height: 58, rx: 14, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${rect({ x: 172, y: 116, width: 56, height: 18, rx: 9, fill: palette.limeSoft, stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${rect({ x: 298, y: 84, width: 54, height: 54, rx: 14, fill: palette.ink, opacity: 0.88 })}
      ${chip(304, 148, 42, 10)}
      ${line({ x1: 120, y1: 120, x2: 152, y2: 120, stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 4 })}
      ${line({ x1: 248, y1: 120, x2: 278, y2: 120, stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 4 })}
      ${path({ d: 'M140 112 L152 120 L140 128', stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })}
      ${path({ d: 'M266 112 L278 120 L266 128', stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })}
      ${orb(320, 222, 34)}
    `,
  }),
  'marketing-window': compose({
    bgStart: '#f7f1e8',
    bgEnd: '#eef2eb',
    scene: `
      ${browserFrame(36, 40, 242, 176, { fill: '#fbfaf5', chrome: '#e8dfd1' })}
      ${rect({ x: 56, y: 82, width: 62, height: 112, rx: 16, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${rect({ x: 132, y: 82, width: 126, height: 68, rx: 20, fill: palette.ink, opacity: 0.9 })}
      ${chip(150, 102, 62, 10)}
      ${outlineRule(150, 122, 84, 0.24)}
      ${rect({ x: 132, y: 160, width: 126, height: 20, rx: 10, fill: palette.limeSoft, stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${card(264, 60, 86, 104, { fill: '#ffffff', rotate: -6 })}
      ${chip(280, 84, 40, 10)}
      ${outlineRule(280, 108, 48, 0.16)}
      ${outlineRule(280, 128, 36, 0.12)}
      ${orb(314, 202, 38)}
    `,
  }),
  'design-systems': compose({
    bgStart: '#f5efe7',
    bgEnd: '#edf2ee',
    scene: `
      ${card(30, 34, 280, 192, { fill: '#faf8f3' })}
      ${rect({ x: 52, y: 58, width: 104, height: 66, rx: 18, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${rect({ x: 170, y: 58, width: 118, height: 66, rx: 18, fill: palette.ink, opacity: 0.9 })}
      ${chip(186, 82, 48, 10)}
      ${outlineRule(186, 104, 70, 0.26)}
      ${rect({ x: 52, y: 138, width: 72, height: 52, rx: 16, fill: palette.limeSoft, stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${rect({ x: 138, y: 138, width: 72, height: 52, rx: 16, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${rect({ x: 224, y: 138, width: 64, height: 52, rx: 16, fill: '#eef1ee', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${line({ x1: 124, y1: 164, x2: 138, y2: 164, stroke: palette.ink, 'stroke-opacity': 0.22, 'stroke-width': 3 })}
      ${line({ x1: 210, y1: 164, x2: 224, y2: 164, stroke: palette.ink, 'stroke-opacity': 0.22, 'stroke-width': 3 })}
      ${card(306, 58, 58, 132, { fill: '#ffffff', rotate: 4 })}
      ${chip(318, 84, 28, 8)}
      ${outlineRule(318, 104, 28, 0.18)}
      ${outlineRule(318, 122, 22, 0.12)}
      ${orb(326, 216, 30)}
    `,
  }),
  'api-lattice': compose({
    bgStart: '#f5efe8',
    bgEnd: '#edf1ef',
    scene: `
      ${card(44, 44, 92, 70, { fill: '#ffffff' })}
      ${card(184, 44, 92, 70, { fill: '#ffffff' })}
      ${card(112, 148, 96, 72, { fill: palette.ink, strokeOpacity: 0 })}
      ${chip(132, 176, 54, 10)}
      ${card(286, 132, 74, 90, { fill: '#ffffff', rotate: 4 })}
      ${rect({ x: 62, y: 70, width: 56, height: 10, rx: 5, fill: palette.limeSoft })}
      ${rect({ x: 202, y: 70, width: 56, height: 10, rx: 5, fill: palette.sand })}
      ${line({ x1: 136, y1: 78, x2: 184, y2: 78, stroke: palette.ink, 'stroke-opacity': 0.26, 'stroke-width': 3 })}
      ${line({ x1: 90, y1: 114, x2: 160, y2: 148, stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3 })}
      ${line({ x1: 230, y1: 114, x2: 160, y2: 148, stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3 })}
      ${line({ x1: 208, y1: 184, x2: 286, y2: 176, stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3 })}
      ${orb(320, 64, 38)}
      ${dotGrid(302, 150, 3, 4, 14, palette.ink, 0.14)}
    `,
  }),
  'database-cluster': compose({
    bgStart: '#f7f1e8',
    bgEnd: '#edf2eb',
    scene: `
      ${ellipseStack(82, 70, 96, 42)}
      ${ellipseStack(192, 104, 110, 48)}
      ${ellipseStack(282, 62, 72, 34)}
      ${line({ x1: 130, y1: 112, x2: 216, y2: 128, stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${line({ x1: 256, y1: 112, x2: 300, y2: 86, stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${card(248, 150, 96, 96, { fill: palette.ink, strokeOpacity: 0, rotate: 5 })}
      ${chip(266, 176, 46, 10)}
      ${outlineRule(266, 198, 38, 0.24)}
      ${outlineRule(266, 216, 26, 0.16)}
      ${orb(316, 210, 34)}
      ${chip(48, 226, 104, 14, palette.sand)}
    `,
  }),
  'cloud-vector': compose({
    bgStart: '#f5efe8',
    bgEnd: '#eaf1ef',
    scene: `
      ${path({ d: 'M72 146 C72 106 104 82 144 82 C160 52 190 38 224 38 C274 38 314 72 314 118 C338 122 356 142 356 168 C356 198 332 222 298 222 H120 C84 222 56 196 56 164 C56 154 62 148 72 146 Z', fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.14, 'stroke-width': 2 })}
      ${path({ d: 'M116 168 C146 142 182 128 226 128 C258 128 286 138 312 160', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3, fill: 'none' })}
      ${circle({ cx: 144, cy: 160, r: 8, fill: palette.lime })}
      ${circle({ cx: 220, cy: 146, r: 8, fill: palette.ink, opacity: 0.7 })}
      ${circle({ cx: 288, cy: 170, r: 8, fill: palette.blue })}
      ${card(264, 52, 78, 90, { fill: palette.ink, strokeOpacity: 0, rotate: 6 })}
      ${chip(278, 76, 42, 10)}
      ${outlineRule(278, 98, 30, 0.24)}
      ${outlineRule(278, 116, 24, 0.18)}
      ${chip(54, 232, 98, 14)}
    `,
  }),
  'auth-gate': compose({
    bgStart: '#f7f1e8',
    bgEnd: '#edf2eb',
    scene: `
      ${path({ d: 'M138 220 V112 C138 76 166 48 202 48 C238 48 266 76 266 112 V220', stroke: palette.ink, 'stroke-opacity': 0.2, 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round' })}
      ${card(122, 124, 160, 108, { fill: '#ffffff' })}
      ${rect({ x: 146, y: 146, width: 112, height: 16, rx: 8, fill: palette.limeSoft })}
      ${rect({ x: 176, y: 176, width: 52, height: 36, rx: 18, fill: palette.ink, opacity: 0.12 })}
      ${chip(148, 154, 108, 14)}
      ${circle({ cx: 202, cy: 184, r: 9, fill: palette.lime })}
      ${orb(290, 76, 38)}
      ${frameLines(122, 124, 160, 108)}
    `,
  }),
  'security-radar': compose({
    bgStart: '#f5efe8',
    bgEnd: '#edf1ef',
    scene: `
      ${circle({ cx: 160, cy: 142, r: 84, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.12, 'stroke-width': 2 })}
      ${circle({ cx: 160, cy: 142, r: 58, fill: 'none', stroke: palette.ink, 'stroke-opacity': 0.1, 'stroke-width': 2 })}
      ${circle({ cx: 160, cy: 142, r: 32, fill: 'none', stroke: palette.ink, 'stroke-opacity': 0.1, 'stroke-width': 2 })}
      ${path({ d: 'M160 142 L224 102', stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3 })}
      ${path({ d: 'M160 142 L204 192', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${circle({ cx: 224, cy: 102, r: 8, fill: palette.lime })}
      ${card(244, 70, 96, 126, { fill: palette.ink, strokeOpacity: 0, rotate: 5 })}
      ${chip(262, 102, 46, 10)}
      ${outlineRule(262, 126, 40, 0.28)}
      ${outlineRule(262, 146, 30, 0.2)}
      ${chip(48, 232, 104, 14)}
    `,
  }),
  'agents-chorus': compose({
    bgStart: '#f6f0e8',
    bgEnd: '#eef2eb',
    scene: `
      ${browserFrame(36, 56, 88, 112, { fill: '#ffffff', chrome: '#e9dfd1' })}
      ${browserFrame(150, 42, 108, 132, { fill: '#faf8f3', chrome: '#ebe3d6' })}
      ${browserFrame(276, 70, 86, 102, { fill: '#ffffff', chrome: '#e8dfd1' })}
      ${line({ x1: 124, y1: 112, x2: 150, y2: 112, stroke: palette.ink, 'stroke-opacity': 0.22, 'stroke-width': 3 })}
      ${line({ x1: 258, y1: 112, x2: 276, y2: 120, stroke: palette.ink, 'stroke-opacity': 0.22, 'stroke-width': 3 })}
      ${chip(56, 92, 48, 10)}
      ${chip(176, 74, 52, 10, palette.sand)}
      ${chip(294, 102, 42, 10)}
      ${card(176, 188, 92, 76, { fill: palette.ink, strokeOpacity: 0, rotate: -6 })}
      ${chip(194, 212, 50, 10)}
      ${orb(314, 216, 34)}
    `,
  }),
  'mcp-link': compose({
    bgStart: '#f6f0e8',
    bgEnd: '#edf2ef',
    scene: `
      ${browserFrame(36, 72, 110, 104, { fill: '#ffffff', chrome: '#e9dfd1' })}
      ${browserFrame(254, 72, 110, 104, { fill: '#ffffff', chrome: '#e2e8e4' })}
      ${rect({ x: 172, y: 98, width: 56, height: 52, rx: 18, fill: palette.ink, opacity: 0.9 })}
      ${chip(184, 120, 32, 10)}
      ${line({ x1: 146, y1: 124, x2: 174, y2: 124, stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3 })}
      ${line({ x1: 228, y1: 124, x2: 254, y2: 124, stroke: palette.ink, 'stroke-opacity': 0.24, 'stroke-width': 3 })}
      ${dotGrid(66, 98, 4, 3, 16, palette.ink, 0.18)}
      ${dotGrid(284, 98, 4, 3, 16, palette.ink, 0.18)}
      ${orb(308, 208, 34)}
      ${chip(36, 226, 92, 14)}
    `,
  }),
  'pattern-badges': compose({
    bgStart: '#f7f1e8',
    bgEnd: '#eef2eb',
    scene: `
      ${card(30, 36, 256, 188, { fill: '#faf8f2' })}
      ${stripeTile(52, 60, 28, repeatSequence([palette.tunedRed, palette.paperAlt], 4))}
      ${stripeTile(92, 60, 28, repeatSequence([palette.orange, palette.appleGreen], 4))}
      ${pinwheelTile(132, 60, 28, [palette.lavender, palette.pink, palette.paperAlt, palette.tunedRed], 45)}
      ${diagonalCutTile(172, 60, 28, [palette.everyGreen, palette.appleGreen, palette.orange])}
      ${cornerBladesTile(212, 60, 28, [palette.ink, palette.appleGreen, palette.lavender, palette.everyGreen])}
      ${stripeTile(52, 100, 28, repeatSequence([palette.pink, palette.lavender], 4), { orientation: 'vertical' })}
      ${pinwheelTile(92, 100, 28, [palette.tunedRed, palette.orange, palette.paperAlt, palette.lime], -45)}
      ${stripeTile(132, 100, 28, repeatSequence([palette.sharpBlue, palette.orange], 8), { orientation: 'vertical' })}
      ${diagonalCutTile(172, 100, 28, [palette.paperAlt, palette.yellow, palette.tunedRed], -90)}
      ${pinwheelTile(212, 100, 28, [palette.appleGreen, palette.everyGreen, palette.lavender, palette.orange])}
      ${cornerBladesTile(52, 140, 28, [palette.paperAlt, palette.lime, palette.orange, palette.tunedRed], -90)}
      ${stripeTile(92, 140, 28, repeatSequence([palette.everyGreen, palette.appleGreen], 8))}
      ${diagonalCutTile(132, 140, 28, [palette.lavender, palette.everyGreen, palette.sand], 45)}
      ${stripeTile(172, 140, 28, repeatSequence([palette.orange, palette.lavender], 8))}
      ${pinwheelTile(212, 140, 28, [palette.yellow, palette.tunedRed, palette.sharpBlue, palette.lime], 45)}
      ${card(298, 62, 64, 110, { fill: '#ffffff', rotate: 6 })}
      ${stripeTile(314, 82, 34, repeatSequence([palette.sharpBlue, palette.orange], 8), { orientation: 'vertical' })}
      ${cornerBladesTile(314, 126, 34, [palette.ink, palette.appleGreen, palette.lavender, palette.everyGreen], 90)}
      ${dotGrid(300, 188, 4, 3, 14, palette.ink, 0.14)}
      ${orb(318, 226, 34)}
      ${chip(34, 236, 104, 14)}
    `,
  }),
  'pattern-cascade': compose({
    bgStart: '#f5efe8',
    bgEnd: '#edf1ef',
    scene: `
      ${path({ d: 'M52 200 C98 164 132 136 178 110 C224 84 274 72 340 66', stroke: palette.ink, 'stroke-opacity': 0.14, 'stroke-width': 3, fill: 'none' })}
      ${stripeTile(54, 178, 44, repeatSequence([palette.everyGreen, palette.appleGreen], 8), { rotate: -8 })}
      ${pinwheelTile(116, 144, 44, [palette.lavender, palette.pink, palette.paperAlt, palette.tunedRed], 45)}
      ${diagonalCutTile(180, 110, 44, [palette.paperAlt, palette.yellow, palette.tunedRed], 6)}
      ${stripeTile(244, 78, 44, repeatSequence([palette.sharpBlue, palette.orange], 8), { orientation: 'vertical', rotate: -10 })}
      ${cornerBladesTile(308, 48, 44, [palette.ink, palette.appleGreen, palette.lavender, palette.everyGreen], 4)}
      ${card(40, 42, 112, 86, { fill: '#ffffff', rotate: -6 })}
      ${stripeTile(62, 68, 30, repeatSequence([palette.tunedRed, palette.paperAlt], 4))}
      ${pinwheelTile(100, 68, 30, [palette.appleGreen, palette.orange, palette.lavender, palette.everyGreen])}
      ${card(250, 146, 104, 106, { fill: palette.ink, strokeOpacity: 0, rotate: 8 })}
      ${stripeTile(274, 170, 40, repeatSequence([palette.orange, palette.appleGreen], 8))}
      ${outlineRule(270, 214, 52, 0.24)}
      ${outlineRule(270, 234, 38, 0.18)}
      ${orb(86, 236, 28)}
      ${chip(40, 220, 126, 14, palette.lavender)}
    `,
  }),
  'pattern-orbit': compose({
    bgStart: '#f6f0e8',
    bgEnd: '#eef2ef',
    scene: `
      ${circle({ cx: 168, cy: 144, r: 88, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.1, 'stroke-width': 2 })}
      ${circle({ cx: 168, cy: 144, r: 58, fill: 'none', stroke: palette.ink, 'stroke-opacity': 0.08, 'stroke-width': 2 })}
      ${card(138, 114, 60, 60, { fill: palette.ink, strokeOpacity: 0, rotate: 8, radius: 18 })}
      ${pinwheelTile(152, 128, 32, [palette.yellow, palette.tunedRed, palette.sharpBlue, palette.lime], 45)}
      ${stripeTile(152, 46, 32, repeatSequence([palette.pink, palette.lavender], 8))}
      ${diagonalCutTile(240, 78, 32, [palette.paperAlt, palette.everyGreen, palette.appleGreen], 90)}
      ${cornerBladesTile(256, 166, 32, [palette.ink, palette.appleGreen, palette.lavender, palette.everyGreen], -90)}
      ${stripeTile(150, 222, 32, repeatSequence([palette.orange, palette.appleGreen], 8), { orientation: 'vertical' })}
      ${pinwheelTile(64, 168, 32, [palette.appleGreen, palette.orange, palette.lavender, palette.everyGreen], -45)}
      ${diagonalCutTile(70, 78, 32, [palette.lavender, palette.tunedRed, palette.yellow], -45)}
      ${path({ d: 'M168 56 L168 86', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${path({ d: 'M238 92 L214 108', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${path({ d: 'M244 182 L214 170', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${path({ d: 'M168 202 L168 222', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${path({ d: 'M94 182 L122 170', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${path({ d: 'M98 92 L122 108', stroke: palette.ink, 'stroke-opacity': 0.18, 'stroke-width': 3 })}
      ${card(284, 54, 70, 90, { fill: '#ffffff', rotate: 6 })}
      ${stripeTile(302, 74, 34, repeatSequence([palette.sharpBlue, palette.orange], 8), { orientation: 'vertical' })}
      ${pinwheelTile(302, 118, 34, [palette.pink, palette.lavender, palette.paperAlt, palette.tunedRed])}
      ${orb(312, 216, 36)}
      ${chip(38, 232, 112, 14)}
    `,
  }),
  'pattern-sails': compose({
    bgStart: '#f4efe7',
    bgEnd: '#edf2ee',
    scene: `
      ${card(34, 38, 222, 186, { fill: '#fbfaf4' })}
      ${stripeTile(56, 64, 42, repeatSequence([palette.everyGreen, palette.appleGreen], 8))}
      ${stripeTile(108, 64, 42, repeatSequence([palette.orange, palette.appleGreen], 8))}
      ${stripeTile(160, 64, 42, repeatSequence([palette.sharpBlue, palette.orange], 8), { orientation: 'vertical' })}
      ${pinwheelTile(56, 118, 42, [palette.lavender, palette.pink, palette.paperAlt, palette.tunedRed], 45)}
      ${diagonalCutTile(108, 118, 42, [palette.paperAlt, palette.yellow, palette.tunedRed])}
      ${cornerBladesTile(160, 118, 42, [palette.ink, palette.appleGreen, palette.lavender, palette.everyGreen])}
      ${diagonalCutTile(66, 172, 32, [palette.lavender, palette.everyGreen, palette.sand], 45)}
      ${stripeTile(110, 172, 32, repeatSequence([palette.pink, palette.lavender], 8), { orientation: 'vertical' })}
      ${pinwheelTile(154, 172, 32, [palette.yellow, palette.tunedRed, palette.sharpBlue, palette.lime], -45)}
      ${path({ d: 'M256 88 C286 66 316 54 352 46', stroke: palette.ink, 'stroke-opacity': 0.16, 'stroke-width': 3, fill: 'none' })}
      ${diagonalCutTile(276, 58, 58, [palette.paperAlt, palette.orange, palette.appleGreen], -8)}
      ${cornerBladesTile(286, 128, 58, [palette.ink, palette.appleGreen, palette.lavender, palette.everyGreen], 6)}
      ${pinwheelTile(274, 202, 42, [palette.pink, palette.tunedRed, palette.orange, palette.yellow], 45)}
      ${orb(326, 84, 40)}
      ${chip(36, 236, 92, 14, palette.lime)}
    `,
  }),
};

function ellipseStack(x, y, width, height) {
  const top = `<ellipse ${attrs({ cx: x + width / 2, cy: y, rx: width / 2, ry: height / 2, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.14, 'stroke-width': 2 })} />`;
  const body = rect({ x, y, width, height: 74, fill: '#ffffff', stroke: palette.ink, 'stroke-opacity': 0.14, 'stroke-width': 2 });
  const bottom = `<ellipse ${attrs({ cx: x + width / 2, cy: y + 74, rx: width / 2, ry: height / 2, fill: '#eef0ee', stroke: palette.ink, 'stroke-opacity': 0.14, 'stroke-width': 2 })} />`;
  return `${body}${top}${bottom}${chip(x + 18, y + 22, width - 36, 10, palette.limeSoft)}${outlineRule(x + 18, y + 46, width - 44, 0.16)}`;
}

for (const [name, svg] of Object.entries(images)) {
  writeFileSync(join(outDir, `${name}.svg`), `${svg}\n`, 'utf8');
}

console.log(`Generated ${Object.keys(images).length} editorial SVGs in ${outDir}`);
