/*
  datepicker.js — Apna custom Date Picker (Calender) logic
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

    if (!inputContainer) return; // Sirf tab chalega jab page pe datepicker hoga

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Dropdown ko kholne/band karne ke liye
    inputContainer.addEventListener('click', (e) => {
        dropdown.classList.toggle('open');
        e.stopPropagation();
    });

    // Jab bahar click ho toh dropdown band kardo
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-datepicker')) {
            dropdown.classList.remove('open');
        }
    });

    // Pichla mahina (Prev) aur agla mahina (Next)
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

        // Mahine ke start date se pehle ke khali dabbe
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            daysContainer.appendChild(empty);
        }

        // Mahine ke asli din
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(currentYear, currentMonth, i);
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = i;

            // Agar purani date hai toh disable kardo (grey)
            if (dateObj < today) {
                dayEl.classList.add('disabled');
            } else {
                // Agar already selected hai toh highlight karo
                if (selectedDate && 
                    selectedDate.getDate() === i && 
                    selectedDate.getMonth() === currentMonth && 
                    selectedDate.getFullYear() === currentYear) {
                    dayEl.classList.add('selected');
                }

                // Din par click karne ka event
                dayEl.addEventListener('click', () => {
                    selectedDate = new Date(currentYear, currentMonth, i);
                    
                    // Form mein bhejne ke liye YYYY-MM-DD format banao
                    const y = selectedDate.getFullYear();
                    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const d = String(selectedDate.getDate()).padStart(2, '0');
                    const formattedValue = `${y}-${m}-${d}`;
                    
                    hiddenInput.value = formattedValue;
                    
                    // Screen pe dikhane ke liye format (jaise 15 Jul 2026)
                    const displayFormat = `${d} ${monthNames[selectedDate.getMonth()].substring(0,3)} ${y}`;
                    dateText.innerHTML = `📅 ${displayFormat}`;
                    inputContainer.classList.add('has-value');

                    dropdown.classList.remove('open');
                    renderCalendar(); // Nayi selected date dikhane ke liye dobara render karo
                });
            }

            daysContainer.appendChild(dayEl);
        }
    }

    renderCalendar();
});
