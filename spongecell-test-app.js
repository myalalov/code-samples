// This exercise can be completed with vanilla JS, but feel
// free to add any productivity dependencies that you use in your 
// normal workflow. If they're unusual let us know what they do :).

import $ from 'jquery'; // If you want jQuery.

// Configuration
const adsDataURL = 'http://localhost:3000/assets/ad.json';

/**
 * Returns compiled string for style of element
 * @param {object} style - set of CSS rules
 * @returns {string}
 */
function getStyle(style) {
    const styleString = Object.keys(style).map(key => key + ': ' + style[key] + ';').join(' ');
    return 'style="' + styleString + '"';
}

/**
 * Returns HTML code for div with its style and content
 * @param {object} div
 * @param {object} div.style
 * @param {string} content
 * @returns {string}
 */
function buildDiv(div, content) {
    return '<div ' + getStyle(div.style) + '>' + content + '</div>';
}

/**
 * Returns HTML code for element of allowed type
 * @param {object} assets - map of known assets by their id's
 * @param {object} element - element data
 * @returns {string}
 */
function buildElement(assets, element) {
    switch (element.type) {
        case 'image':
            return '<img src="' + assets[element.image.masterAssetId] + '" ' + getStyle(element.style) + ' />';
        case 'text':
            return buildDiv(element, element.text.content);
    default:
        return '';
    }
}

/**
 * Builds ads and appends them to the document
 */
function buildAd() {
    $.get(adsDataURL, function (data) {
        $('body').append(buildDiv(data,
            data.settings.screens.map(screen =>
                buildDiv(screen, screen.elements.map(element => buildElement(data.assets, element)).join(''))
            ).join('')
        ));
    });
}

document.addEventListener('DOMContentLoaded', buildAd);
