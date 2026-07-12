/*
  datepicker.js — Custom Modern Date Picker Logic
*/

document.addEventListener('DOMContentLoaded', () => {
    const inputContainer = document.getElementById('cdpInput');
    const dropdown = document.getElementById('cdpDropdown');
    const monthYear = document.getElementById('cdpMonthYear');
    const daysContainer = document.getElementById('cdpDays');
    const prevBtn = document.getElementById('calendarPrev');
    const nextBtn = document.getElementById('calendarNext');
    const dateText = document.getElementById('calendarDateText');
    const hiddenInput = document.getElementById('date');

    if (!inputContainer) return; // Only run on pages with the date picker

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Toggle dropdown
    inputContainer.addEventListener('click', (e) => {
        dropdown.classList.toggle('active');
        e.stopPropagation();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-datepicker')) {
            dropdown.classList.remove('active');
        }
    });

    // Prev/Next month
    prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    function renderCalendar() {
        monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        daysContainer.innerHTML = '';

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Empty slots before first day
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            daysContainer.appendChild(empty);
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(currentYear, currentMonth, i);
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = i;

            // Check if past date
            if (dateObj < today) {
                dayEl.classList.add('disabled');
            } else {
                // Check if selected
                if (selectedDate && 
                    selectedDate.getDate() === i && 
                    selectedDate.getMonth() === currentMonth && 
                    selectedDate.getFullYear() === currentYear) {
                    dayEl.classList.add('selected');
                }

                // Click event
                dayEl.addEventListener('click', () => {
                    selectedDate = new Date(currentYear, currentMonth, i);
                    
                    // Format as YYYY-MM-DD for hidden input
                    const y = selectedDate.getFullYear();
                    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const d = String(selectedDate.getDate()).padStart(2, '0');
                    const formattedValue = `${y}-${m}-${d}`;
                    
                    hiddenInput.value = formattedValue;
                    
                    // Format for display (e.g. 15 Jul 2026)
                    const displayFormat = `${d} ${monthNames[selectedDate.getMonth()].substring(0,3)} ${y}`;
                    dateText.innerHTML = `📅 ${displayFormat}`;
                    inputContainer.classList.add('has-value');

                    dropdown.classList.remove('active');
                    renderCalendar(); // Re-render to show selected state
                });
            }

            daysContainer.appendChild(dayEl);
        }
    }

    renderCalendar();
});
