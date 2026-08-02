// Datepicker init on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const customDatePicker = document.getElementById('customDatePicker');
    if (!customDatePicker) return; // Agar page par datepicker nahi hai toh exit karo
    
    const cdpInput = document.getElementById('cdpInput');
    const cdpDropdown = document.getElementById('cdpDropdown');
    const cdpDays = document.getElementById('cdpDays');
    const cdpMonthYear = document.getElementById('cdpMonthYear');
    const calendarPrev = document.getElementById('calendarPrev');
    const calendarNext = document.getElementById('calendarNext');
    const calendarDateText = document.getElementById('calendarDateText');
    const hiddenDateInput = document.getElementById('date');

    let currentDate = new Date();
    let selectedDate = new Date();

    // Calendar render karne ka logic
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        cdpMonthYear.textContent = `${monthNames[month]} ${year}`;
        
        cdpDays.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Khali cells start of month ke liye
        for (let i = 0; i < firstDay; i++) {
            cdpDays.innerHTML += `<div></div>`;
        }

        // Days render karo
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            const isPast = dateObj < today;
            const isSelected = selectedDate && dateObj.getTime() === selectedDate.getTime();
            
            const dayDiv = document.createElement('div');
            dayDiv.className = `cdp-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`;
            dayDiv.textContent = i;
            
            if (!isPast) {
                dayDiv.onclick = () => selectDate(new Date(year, month, i));
            }
            
            cdpDays.appendChild(dayDiv);
        }
    };

    // Date select karne ka function
    const selectDate = (date) => {
        selectedDate = date;
        
        // YYYY-MM-DD format banalo
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (hiddenDateInput) hiddenDateInput.value = formattedDate;
        
        // Display text format (e.g., 15 Aug 2023)
        const displayFormat = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        if (calendarDateText) calendarDateText.textContent = displayFormat;
        
        renderCalendar();
        cdpDropdown.style.display = 'none';
    };

    // Events attach karo
    cdpInput.onclick = (e) => {
        e.stopPropagation();
        const isVisible = cdpDropdown.style.display === 'block';
        cdpDropdown.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) renderCalendar();
    };

    calendarPrev.onclick = (e) => {
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    calendarNext.onclick = (e) => {
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!customDatePicker.contains(e.target)) {
            cdpDropdown.style.display = 'none';
        }
    });

    // Default select today
    selectDate(new Date());
});
