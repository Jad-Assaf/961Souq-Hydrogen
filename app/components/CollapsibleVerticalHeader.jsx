/********************************************************************
 *  src/components/CollapsibleVerticalHeader.jsx
 *
 *  **Only change** → top-level items now iterate through a fixed
 *  SVG array.  Everything else is untouched.
 ********************************************************************/

import React, {useEffect, useRef, useState} from 'react';
import {NavLink} from '@remix-run/react';

/* SVGs for the FIRST LEVEL (place in order) */
const TOP_LEVEL_SVGS = [
  /* 0 */ `<svg width="64px" height="64px" viewBox="-1.5 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>apple [#173]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-102.000000, -7439.000000)" fill="#000000"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M57.5708873,7282.19296 C58.2999598,7281.34797 58.7914012,7280.17098 58.6569121,7279 C57.6062792,7279.04 56.3352055,7279.67099 55.5818643,7280.51498 C54.905374,7281.26397 54.3148354,7282.46095 54.4735932,7283.60894 C55.6455696,7283.69593 56.8418148,7283.03894 57.5708873,7282.19296 M60.1989864,7289.62485 C60.2283111,7292.65181 62.9696641,7293.65879 63,7293.67179 C62.9777537,7293.74279 62.562152,7295.10677 61.5560117,7296.51675 C60.6853718,7297.73474 59.7823735,7298.94772 58.3596204,7298.97372 C56.9621472,7298.99872 56.5121648,7298.17973 54.9134635,7298.17973 C53.3157735,7298.17973 52.8162425,7298.94772 51.4935978,7298.99872 C50.1203933,7299.04772 49.0738052,7297.68074 48.197098,7296.46676 C46.4032359,7293.98379 45.0330649,7289.44985 46.8734421,7286.3899 C47.7875635,7284.87092 49.4206455,7283.90793 51.1942837,7283.88393 C52.5422083,7283.85893 53.8153044,7284.75292 54.6394294,7284.75292 C55.4635543,7284.75292 57.0106846,7283.67793 58.6366882,7283.83593 C59.3172232,7283.86293 61.2283842,7284.09893 62.4549652,7285.8199 C62.355868,7285.8789 60.1747177,7287.09489 60.1989864,7289.62485" id="apple-[#173]"> </path> </g> </g> </g> </g></svg>`,
  /* 1 */ `<svg fill="#000000" height="64px" width="64px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 347.873 347.873" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M221.218,97.832h-94.563c-18.041,0-32.719,14.678-32.719,32.72v33.436c0,18.042,14.678,32.72,32.719,32.72 c18.04,0,32.717-14.678,32.717-32.72V152.27h29.129v11.718c0,18.042,14.677,32.72,32.717,32.72 c18.041,0,32.719-14.678,32.719-32.72v-33.436C253.936,112.511,239.259,97.832,221.218,97.832z M137.987,139.478h-5.664v5.667 c0,2.761-2.238,5-5,5c-2.762,0-5-2.239-5-5v-5.667h-5.668c-2.762,0-5-2.239-5-5s2.238-5,5-5h5.668v-5.665c0-2.761,2.238-5,5-5 c2.762,0,5,2.239,5,5v5.665h5.664c2.762,0,5,2.239,5,5S140.749,139.478,137.987,139.478z M165.893,132.909h-7.625 c-2.762,0-5-2.239-5-5c0-2.761,2.238-5,5-5h7.625c2.762,0,5,2.239,5,5C170.893,130.67,168.655,132.909,165.893,132.909z M187.895,132.909h-7.627c-2.762,0-5-2.239-5-5c0-2.761,2.238-5,5-5h7.627c2.762,0,5,2.239,5,5 C192.895,130.67,190.657,132.909,187.895,132.909z M204.372,127.909c0-3.611,2.93-6.541,6.543-6.541 c3.611,0,6.541,2.93,6.541,6.541c0,3.615-2.93,6.544-6.541,6.544C207.302,134.453,204.372,131.523,204.372,127.909z M216.591,153.023c-3.615,0-6.543-2.93-6.543-6.543c0-3.615,2.928-6.544,6.543-6.544c3.611,0,6.541,2.929,6.541,6.544 C223.132,150.093,220.202,153.023,216.591,153.023z M229.673,138.763c-3.611,0-6.541-2.93-6.541-6.541 c0-3.615,2.93-6.543,6.541-6.543c3.615,0,6.545,2.928,6.545,6.543C236.218,135.833,233.288,138.763,229.673,138.763z"></path> <path d="M337.873,33.937H10c-5.523,0-10,4.477-10,10v210.393c0,5.523,4.477,10,10,10h114.979 c-4.407,21.476-14.601,32.572-14.674,32.651c-2.793,2.885-3.59,7.16-2.023,10.857c1.566,3.697,5.191,6.099,9.207,6.099h112.895 c4.016,0,7.641-2.402,9.207-6.099c1.566-3.697,0.77-7.973-2.023-10.857c-0.117-0.122-10.279-11.174-14.676-32.651h114.981 c5.523,0,10-4.477,10-10V43.937C347.873,38.414,343.396,33.937,337.873,33.937z M327.873,244.329h-16.311v-2.816 c0-5.523-4.477-10-10-10s-10,4.477-10,10v2.816h-10.439v-2.816c0-5.523-4.477-10-10-10c-5.522,0-10,4.477-10,10v2.816h-49.782 h-74.809H20V53.937h307.873V244.329z"></path> </g> </g></svg>`,
  /* 2 */ `<svg width="64px" height="64px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>computer-solid</title> <g id="Layer_2" data-name="Layer 2"> <g id="invisible_box" data-name="invisible box"> <rect width="48" height="48" fill="none"></rect> </g> <g id="icons_Q2" data-name="icons Q2"> <path d="M41,6H7A2,2,0,0,0,5,8V32a2,2,0,0,0,2,2H41a2,2,0,0,0,2-2V8a2,2,0,0,0-2-2Z"></path> <path d="M44,42H4a2,2,0,0,1,0-4H44a2,2,0,0,1,0,4Z"></path> </g> </g> </g></svg>`,
  /* 3 */ `<svg width="64px" height="64px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#000000" d="M29.65 117.89v276.22h124.62V117.89H29.65zm90.55 253.16a11 11 0 1 1 11-11 11 11 0 0 1-11 11zm18-189.16H45.56v-16h92.63v16zm0-32H45.56v-16h92.63v16zm153 188.51h73.1v39.71h41.74v16H249.48v-16h41.74V338.4zm-118-220.51V322.4h309.15V117.89H173.19zM466.35 306.4H189.19V133.89h277.16V306.4z"></path></g></svg>`,
  /* 3 */ `<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" width="64px" height="64px" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#000000;} </style> <g> <rect x="141.312" class="st0" width="32.771" height="71.683"></rect> <rect x="206.853" class="st0" width="32.761" height="71.683"></rect> <rect x="272.385" class="st0" width="32.761" height="71.683"></rect> <rect x="337.917" class="st0" width="32.77" height="71.683"></rect> <rect x="141.312" y="440.326" class="st0" width="32.771" height="71.674"></rect> <rect x="206.853" y="440.326" class="st0" width="32.761" height="71.674"></rect> <rect x="272.385" y="440.326" class="st0" width="32.761" height="71.674"></rect> <rect x="337.917" y="440.326" class="st0" width="32.77" height="71.674"></rect> <rect x="440.321" y="141.307" class="st0" width="71.674" height="32.771"></rect> <rect x="440.321" y="206.849" class="st0" width="71.674" height="32.77"></rect> <rect x="440.321" y="272.39" class="st0" width="71.674" height="32.761"></rect> <rect x="440.321" y="337.922" class="st0" width="71.674" height="32.77"></rect> <rect x="0.005" y="141.307" class="st0" width="71.674" height="32.771"></rect> <rect x="0.005" y="206.849" class="st0" width="71.674" height="32.77"></rect> <rect x="0.005" y="272.39" class="st0" width="71.674" height="32.761"></rect> <rect x="0.005" y="337.922" class="st0" width="71.674" height="32.77"></rect> <path class="st0" d="M255.246,252.209c6.171,0,9.862-3.586,9.862-9.06c0-5.485-3.69-9.176-9.862-9.176h-11.16 c-0.4,0-0.6,0.21-0.6,0.61v17.025c0,0.4,0.2,0.601,0.6,0.601H255.246z"></path> <path class="st0" d="M92.165,419.84h327.67V92.17H92.165V419.84z M367.359,130.568c8.479,0,15.356,6.867,15.356,15.356 c0,8.488-6.876,15.355-15.356,15.355c-8.479,0-15.356-6.867-15.356-15.355C352.004,137.434,358.88,130.568,367.359,130.568z M367.359,353.287c8.479,0,15.356,6.867,15.356,15.356c0,8.488-6.876,15.355-15.356,15.355c-8.479,0-15.356-6.867-15.356-15.355 C352.004,360.154,358.88,353.287,367.359,353.287z M290.821,222.318c0-0.591,0.4-0.991,1.001-0.991h12.648 c0.6,0,1.001,0.4,1.001,0.991v42.242c0,8.069,4.483,12.648,11.35,12.648c6.772,0,11.264-4.578,11.264-12.648v-42.242 c0-0.591,0.4-0.991,0.992-0.991h12.646c0.601,0,0.992,0.4,0.992,0.991v41.851c0,16.825-10.749,25.99-25.895,25.99 c-15.232,0-25.999-9.165-25.999-25.99V222.318z M228.846,222.318c0-0.591,0.4-0.991,1.001-0.991h26.295 c14.745,0,23.605,8.87,23.605,21.822c0,12.741-8.966,21.707-23.605,21.707h-12.056c-0.4,0-0.6,0.2-0.6,0.6v22.614 c0,0.591-0.391,0.991-0.991,0.991h-12.648c-0.601,0-1.001-0.4-1.001-0.991V222.318z M167.673,236.872 c3.586-11.063,12.256-16.633,24.112-16.633c11.454,0,19.819,5.57,23.605,15.03c0.295,0.496,0.095,0.992-0.496,1.202l-10.863,4.874 c-0.592,0.296-1.097,0.104-1.393-0.486c-1.889-4.387-5.084-7.678-10.759-7.678c-5.274,0-8.66,2.795-10.157,7.468 c-0.801,2.499-1.097,4.883-1.097,14.554c0,9.652,0.296,12.046,1.097,14.535c1.497,4.673,4.883,7.468,10.157,7.468 c5.675,0,8.87-3.291,10.759-7.669c0.296-0.6,0.801-0.791,1.393-0.496l10.863,4.874c0.591,0.21,0.791,0.706,0.496,1.202 c-3.786,9.461-12.152,15.04-23.605,15.04c-11.856,0-20.525-5.58-24.112-16.643c-1.487-4.368-1.888-7.859-1.888-18.312 C165.785,244.732,166.186,241.26,167.673,236.872z M144.64,130.568c8.489,0,15.365,6.876,15.365,15.356 c0,8.478-6.876,15.355-15.365,15.355c-8.488,0-15.355-6.876-15.355-15.355C129.285,137.444,136.152,130.568,144.64,130.568z M144.64,353.287c8.489,0,15.365,6.876,15.365,15.356c0,8.478-6.876,15.355-15.365,15.355c-8.488,0-15.355-6.877-15.355-15.355 C129.285,360.163,136.152,353.287,144.64,353.287z"></path> </g> </g></svg>`,
  /* 3 */ `<svg width="64px" height="64px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M1.17157 5.82843L0 7L1.41421 8.41421L2.58579 7.24264C4.02173 5.8067 5.96928 5 8 5C10.0307 5 11.9783 5.8067 13.4142 7.24264L14.5858 8.41421L16 7L14.8284 5.82843C13.0174 4.01742 10.5612 3 8 3C5.43884 3 2.98259 4.01741 1.17157 5.82843Z" fill="#030708"></path><path d="M13.1716 9.82842L12 8.65686C10.9391 7.59599 9.5003 7 8.00001 7C6.49971 7 5.06087 7.59599 4.00001 8.65685L2.82843 9.82843L4.24264 11.2426L5.41422 10.0711C6.10001 9.38527 7.03015 9 8.00001 9C8.96986 9 9.9 9.38527 10.5858 10.0711L11.7574 11.2426L13.1716 9.82842Z" fill="#030708"></path><path d="M10.3432 12.6569L9.17158 11.4853C8.86086 11.1746 8.43943 11 8 11C7.56058 11 7.13915 11.1746 6.82843 11.4853L5.65686 12.6569L8.00001 15L10.3432 12.6569Z" fill="#030708"></path></g></svg>`,
  /* 3 */ `<svg fill="#000000" width="64px" height="64px" viewBox="0 -3 32 32" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M30.000,21.000 L17.000,21.000 L17.000,24.000 L22.047,24.000 C22.600,24.000 23.047,24.448 23.047,25.000 C23.047,25.552 22.600,26.000 22.047,26.000 L10.047,26.000 C9.494,26.000 9.047,25.552 9.047,25.000 C9.047,24.448 9.494,24.000 10.047,24.000 L15.000,24.000 L15.000,21.000 L2.000,21.000 C0.898,21.000 0.000,20.103 0.000,19.000 L0.000,2.000 C0.000,0.897 0.898,0.000 2.000,0.000 L30.000,0.000 C31.103,0.000 32.000,0.897 32.000,2.000 L32.000,19.000 C32.000,20.103 31.103,21.000 30.000,21.000 ZM2.000,2.000 L2.000,19.000 L29.997,19.000 L30.000,2.000 L2.000,2.000 Z"></path> </g></svg>`,
  /* 3 */ `<svg fill="#000000" width="64px" height="64px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>mobile-button</title> <path d="M22 1.25h-12c-1.518 0.002-2.748 1.232-2.75 2.75v24c0.002 1.518 1.232 2.748 2.75 2.75h12c1.518-0.002 2.748-1.232 2.75-2.75v-24c-0.002-1.518-1.232-2.748-2.75-2.75h-0zM23.25 28c-0.001 0.69-0.56 1.249-1.25 1.25h-12c-0.69-0.001-1.249-0.56-1.25-1.25v-24c0.001-0.69 0.56-1.249 1.25-1.25h12c0.69 0.001 1.249 0.56 1.25 1.25v0zM15.3 25.299c-0.185 0.173-0.3 0.418-0.3 0.69 0 0.004 0 0.008 0 0.012v-0.001c-0 0.004-0 0.009-0 0.014 0 0.277 0.115 0.527 0.3 0.704l0 0c0.176 0.185 0.424 0.301 0.7 0.301s0.524-0.115 0.699-0.3l0-0c0.186-0.178 0.301-0.429 0.301-0.706 0-0.004-0-0.009-0-0.013v0.001c0-0.003 0-0.007 0-0.010 0-0.273-0.116-0.518-0.3-0.69l-0.001-0.001c-0.181-0.176-0.427-0.284-0.7-0.284s-0.519 0.108-0.7 0.284l0-0z"></path> </g></svg>`,
  /* 3 */ `<svg width="64px" height="64px" viewBox="-39.15 0 334.851 334.851" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><style>.a{fill:#211715;}.b{fill:#ffffff;}.c{fill:#4d4544;}</style></defs><path class="a" d="M213.387,8.456V2.413l-2.4,2.4q8.753,0,17.507-.013l-2.4-2.4V8.334c0,3.089,4.8,3.094,4.8,0V2.4a2.435,2.435,0,0,0-2.4-2.4q-8.754,0-17.507.013a2.435,2.435,0,0,0-2.4,2.4V8.456c0,3.089,4.8,3.094,4.8,0Z"></path><path class="a" d="M248.376,34.62h5.76l-2.4-2.4q0,8.754.013,17.507l2.4-2.4H248.5c-3.088,0-3.093,4.8,0,4.8h5.651a2.435,2.435,0,0,0,2.4-2.4q0-8.754-.013-17.507a2.435,2.435,0,0,0-2.4-2.4h-5.76c-3.089,0-3.094,4.8,0,4.8Z"></path><path class="a" d="M248.376,65.623h5.76l-2.4-2.4q0,8.753.013,17.507l2.4-2.4H248.5c-3.088,0-3.093,4.8,0,4.8h5.651a2.435,2.435,0,0,0,2.4-2.4q0-8.754-.013-17.507a2.435,2.435,0,0,0-2.4-2.4h-5.76c-3.089,0-3.094,4.8,0,4.8Z"></path><path class="a" d="M250.643,324.384V13.338a8,8,0,0,0-8-8H10.407a8,8,0,0,0-8,8V324.4a7.994,7.994,0,0,0,7.993,8c46.879,0,184.162,0,232.251-.012A8,8,0,0,0,250.643,324.384Z"></path><path class="a" d="M253.043,324.384V14.594a17.934,17.934,0,0,0-.2-3.235c-.921-5.14-5.6-8.393-10.626-8.421-3.563-.019-7.127,0-10.691,0H19.036c-2.858,0-5.723-.059-8.58,0A10.572,10.572,0,0,0,.007,13.415c-.015.708,0,1.418,0,2.126v304.7c0,4.11-.254,8.038,2.9,11.36,2.748,2.9,6.295,3.2,10.035,3.2h68.24l49.514,0,49.039,0,42.1,0,15.851,0c2.67,0,5.663.341,8.219-.523a10.588,10.588,0,0,0,7.145-9.878c.087-3.09-4.714-3.088-4.8,0a5.718,5.718,0,0,1-2.29,4.531,7.2,7.2,0,0,1-4.582,1.069l-7.257,0-17.177,0-42.753,0-48.992,0-48.763,0H17.562c-2.275,0-4.551.018-6.826,0a5.7,5.7,0,0,1-5.929-5.607c-.035-1.973,0-3.95,0-5.923V15.1c0-.582-.011-1.165,0-1.746.059-3.414,2.782-5.6,6.039-5.62,3.533-.016,7.067,0,10.6,0H232.771c3.218,0,6.437-.03,9.654,0a5.7,5.7,0,0,1,5.818,5.7c.011.712,0,1.426,0,2.138V324.384C248.243,327.472,253.043,327.478,253.043,324.384Z"></path><path class="b" d="M239.325,317.078V20.71a4,4,0,0,0-4-4H17.765a4,4,0,0,0-4,4V317.091a4,4,0,0,0,4,4c42.473,0,173.521,0,217.565-.013A4,4,0,0,0,239.325,317.078Z"></path><path class="b" d="M241.325,317.078V23c0-.718.021-1.441,0-2.159a6.146,6.146,0,0,0-6.182-6.134c-3-.082-6.016,0-9.017,0H26.767c-2.948,0-5.911-.085-8.858,0a6.147,6.147,0,0,0-6.144,6.157c-.021.741,0,1.486,0,2.226V311.959a51.594,51.594,0,0,0,.057,5.807A6,6,0,0,0,15.2,322.5a9.715,9.715,0,0,0,4.288.587H127.171l45.553,0,39.755,0,15.2,0,6.4,0a7.985,7.985,0,0,0,4.329-.857,6.18,6.18,0,0,0,2.917-5.143c.13-2.573-3.871-2.566-4,0-.139,2.765-4.092,2-5.99,2H224.4l-16.534,0-40.3,0-45.659,0-44.813,0H23.656a39.548,39.548,0,0,1-6.167-.01,2.087,2.087,0,0,1-1.724-2.147c-.106-2.278,0-4.586,0-6.865V22.686c0-.63-.042-1.277,0-1.906.109-1.6,1.3-2.07,2.642-2.07H227.218c2.658,0,5.39-.182,8.045,0,2.695.186,2.062,3.629,2.062,5.523V317.078C237.325,319.651,241.325,319.656,241.325,317.078Z"></path><circle class="c" cx="126.522" cy="8.855" r="2.666"></circle></g></svg>`,
  /* 3 */ `<svg fill="#000000" width="64px" height="64px" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 0v8h1v-8h-1zm-2 1v6h1v-6h-1zm4 1v4h1v-4h-1zm-6 1v2h1v-2h-1z"></path> </g></svg>`,
  /* 3 */ `<svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 490 490" xml:space="preserve" width="64px" height="64px"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M420.931,104.275h-44.166V0H113.236v104.275H69.069C30.982,104.275,0,136.499,0,176.104v123.732 c0,39.615,30.982,71.839,69.069,71.839h33.506V490h284.839V371.675h33.516c38.089,0,69.069-32.224,69.069-71.839V176.104 C490,136.499,459.02,104.275,420.931,104.275z M134.087,20.852h221.827v83.424H134.087V20.852z M366.564,469.149H123.427V290.204 h243.137V469.149z M469.149,299.836c0,28.109-21.635,50.987-48.218,50.987h-33.516v-81.47H102.576v81.47H69.069 c-26.583,0-48.218-22.878-48.218-50.987V176.104c0-28.11,21.635-50.978,48.218-50.978h351.862 c26.583,0,48.218,22.867,48.218,50.978V299.836z"></path> <rect x="173.997" y="337.975" width="141.997" height="20.852"></rect> <rect x="173.997" y="395.508" width="141.997" height="20.852"></rect> <rect x="366.34" y="173.354" width="31.124" height="20.852"></rect> </g> </g></svg>`,
  /* 3 */ `<svg fill="#000000" width="64px" height="64px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title>ionicons-v5-m</title><path d="M193.69,152.84a16,16,0,0,1,29.64,2.56l36.4,121.36,30-59.92a16,16,0,0,1,28.62,0L345.89,272h96.76A213.08,213.08,0,0,0,464,176.65C463.37,114.54,413.54,64,352.92,64c-48.09,0-80,29.54-96.92,51-16.88-21.49-48.83-51-96.92-51C98.46,64,48.63,114.54,48,176.65A211.13,211.13,0,0,0,56.93,240h93.18Z"></path><path d="M321.69,295.16,304,259.78l-33.69,67.38A16,16,0,0,1,256,336q-.67,0-1.38-.06a16,16,0,0,1-14-11.34l-36.4-121.36-30,59.92A16,16,0,0,1,160,272H69.35q14,29.29,37.27,57.66c18.77,22.88,52.8,59.46,131.39,112.81a31.84,31.84,0,0,0,36,0c78.59-53.35,112.62-89.93,131.39-112.81a316.79,316.79,0,0,0,19-25.66H336A16,16,0,0,1,321.69,295.16Z"></path><path d="M464,272H442.65a260.11,260.11,0,0,1-18.25,32H464a16,16,0,0,0,0-32Z"></path><path d="M48,240a16,16,0,0,0,0,32H69.35a225.22,225.22,0,0,1-12.42-32Z"></path></g></svg>`,
  /* 3 */ `<svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000" stroke-width="2"></path> <path d="M3.59998 15H14.15" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M6.55115 4.93823L9.81128 14.9719" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M17.0323 4.6355L8.49722 10.8366" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M20.5591 14.5104L12.024 8.30924" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12.2574 20.9159L15.5176 10.8822" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`,
  /* 3 */ `<svg fill="#000000" height="64px" width="64px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 463 463" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M310.776,453.681l-4.971-19.879C303.186,423.32,293.811,416,283.007,416H255v-32.773c9.701-7.204,16-18.743,16-31.727v-80 c0-12.99-6.305-24.533-16.013-31.736c0.003-0.089,0.013-0.177,0.013-0.267V23.5C255,10.542,244.458,0,231.5,0S208,10.542,208,23.5 v215.997c0,0.09,0.01,0.178,0.013,0.267C198.305,246.967,192,258.51,192,271.5v80c0,12.984,6.299,24.523,16,31.727V416h-28.008 c-10.804,0-20.179,7.32-22.799,17.801l-4.97,19.88c-0.56,2.241-0.057,4.614,1.365,6.435c1.421,1.82,3.602,2.884,5.911,2.884h144 c2.31,0,4.49-1.064,5.911-2.884C310.833,458.295,311.336,455.921,310.776,453.681z M231.5,15c4.687,0,8.5,3.813,8.5,8.5V48h-17V23.5 C223,18.813,226.813,15,231.5,15z M223,63h17v169.931c-2.74-0.603-5.582-0.931-8.5-0.931s-5.76,0.328-8.5,0.931V63z M231.5,247 c13.51,0,24.5,10.991,24.5,24.5v8.5h-49v-8.5C207,257.991,217.99,247,231.5,247z M207,295h17v56.5c0,4.142,3.357,7.5,7.5,7.5 s7.5-3.358,7.5-7.5V295h17v56.5c0,13.509-10.99,24.5-24.5,24.5S207,365.009,207,351.5V295z M223,390.069 c2.74,0.603,5.582,0.931,8.5,0.931s5.76-0.328,8.5-0.931V416h-17V390.069z M169.105,448l2.641-10.562 c0.947-3.791,4.338-6.438,8.246-6.438h103.015c3.908,0,7.299,2.647,8.246,6.439L293.894,448H169.105z"></path> </g></svg>`,
  // …add / reorder to match your first-level menu order
];

export function CollapsibleVerticalHeader({header}) {
  const {shop, menu} = header;
  const [openSubs, setOpenSubs] = useState({});
  const headerRef = useRef(null);

  /* ───── helpers ───── */
  const img = (item) => item.imageUrl || item?.items?.[0]?.imageUrl || '';
  const kids = (item) => Boolean(item.items?.length);

  const toggle = (lvl, id) =>
    setOpenSubs((prev) => {
      const next = {...prev};
      next[lvl] = prev[lvl] === id ? undefined : id;
      Object.keys(next).forEach((k) => +k > lvl && delete next[k]);
      return next;
    });

  const expand = () => document.body.classList.add('header-expanded');
  const collapse = () => {
    document.body.classList.remove('header-expanded');
    setOpenSubs({});
  };

  /* ───── 1-time effects (unchanged) ───── */
  useEffect(() => {
    document.body.classList.add('with-vertical-header');
    document.body.classList.remove('header-expanded');
    return () => {
      document.body.classList.remove('with-vertical-header');
      document.body.classList.remove('header-expanded');
    };
  }, []);

  useEffect(() => {
    const outside = (e) => !headerRef.current?.contains(e.target) && collapse();
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
    };
  }, []);

  /* ───── renderer (SVG logic added) ───── */
  /* ───── renderer (only change: deeper levels show NO images) ───── */
  const render = (items, lvl = 1) =>
    items.map((item, idx) => {
      const open = openSubs[lvl] === item.id;
      const parent = kids(item);

      /* SVG only for first-level */
      const svgMarkup =
        lvl === 1 && TOP_LEVEL_SVGS[idx] ? TOP_LEVEL_SVGS[idx] : null;

      return (
        <div key={item.id} className={`vh-item vh-level-${lvl}`}>
          <div className="vh-link">
            {/* icon only on the first level */}
            {lvl === 1 && svgMarkup && (
              <span
                className="vh-icon"
                dangerouslySetInnerHTML={{__html: svgMarkup}}
              />
            )}

            <NavLink to={new URL(item.url).pathname} className="vh-navlink">
              <p>{item.title}</p>
            </NavLink>

            {parent && (
              <button
                type="button"
                className="vh-toggle-btn"
                aria-label={open ? 'Collapse submenu' : 'Expand submenu'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(lvl, item.id);
                }}
              >
                {open ? (
                  <svg
                    fill="#2172af"
                    height="40px"
                    width="40px"
                    viewBox="0 0 425 425"
                  >
                    <polygon points="212.5,0 19.371,192.5 405.629,192.5 " />
                  </svg>
                ) : (
                  <svg
                    fill="#2172af"
                    height="40px"
                    width="40px"
                    viewBox="0 0 386.257 386.257"
                    stroke="#2172af"
                  >
                    <polygon points="0,96.879 193.129,289.379 386.257,96.879 " />
                  </svg>
                )}
              </button>
            )}
          </div>

          {parent && (
            <div className={`vh-submenu ${open ? 'open' : ''}`}>
              {render(item.items, lvl + 1)}
            </div>
          )}
        </div>
      );
    });

  /* ───── layout (unchanged) ───── */
  return (
    <div
      ref={headerRef}
      className="vertical-header"
      onMouseEnter={expand}
      onMouseLeave={collapse}
    >
      <div className="vh-logo">
        <NavLink to="/" className="vh-logo-link">
          <img
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo_Cart_19e9e372-5859-44c9-8915-11b81ed78213.png?v=1719486376"
            alt={shop.name}
            className="logo-collapsed"
            width="50"
            height="50"
          />
          <img
            src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912&width=400"
            alt={shop.name}
            className="logo-expanded"
            width="120"
            height="50"
          />
        </NavLink>
      </div>

      <nav className="vertical-menu">{render(menu.items)}</nav>
    </div>
  );
}
