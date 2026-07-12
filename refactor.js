const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'css/style.css',
    'js/main.js',
    'js/results.js',
    'js/seat-selection.js',
    'js/bookings.js',
    'js/datepicker.js'
];

const classMappings = {
    'cdp-input': 'calendar-input',
    'cdp-dropdown': 'calendar-dropdown',
    'cdp-header': 'calendar-header',
    'cdp-month-year': 'calendar-month-year',
    'cdp-weekdays': 'calendar-weekdays',
    'cdp-days': 'calendar-days',
    'cdp-day': 'calendar-day',
    'cdpPrev': 'calendarPrev',
    'cdpNext': 'calendarNext',
    'cdpDateText': 'calendarDateText',
    
    'fs-item': 'feature-box',
    'fs-icon': 'feature-icon',
    'fs-label': 'feature-title',
    'fs-sub': 'feature-sub',
    
    'rc-operator': 'route-operator',
    'rc-vehicle': 'route-vehicle',
    'rc-journey': 'route-journey',
    'rc-point': 'route-point',
    'rc-time': 'route-time',
    'rc-city': 'route-city',
    'rc-connector': 'route-connector',
    'rc-duration': 'route-duration',
    'rc-line': 'route-line',
    'rc-action': 'route-action',
    'rc-price': 'ticket-price',
    
    'trb-point': 'trip-point',
    'trb-label': 'trip-label',
    'trb-city': 'trip-city',
    'trb-time': 'trip-time',
    'trb-arrow': 'trip-arrow',
    
    'bc-route': 'booking-route',
    'bc-details': 'booking-details',
    'bc-status': 'booking-status',
    'bc-price': 'booking-price'
};

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    for (const [oldClass, newClass] of Object.entries(classMappings)) {
        const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
        content = content.replace(regex, newClass);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
