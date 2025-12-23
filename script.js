/* script.js - localStorage-based unified front-end
   - Faculty: add/edit/delete/search
   - Student: view, filter, download PDF
   - Admin: view, filter, search, export CSV (no delete)
*/

// small helpers
const $ = id => document.getElementById(id);

// demo credentials
const credentials = {
  student: { username: 'student', password: 'pass' },
  faculty: { username: 'faculty', password: 'pass' },
  admin: { username: 'admin', password: 'pass' }
};

// Subjects data (same structure)
const subjectsData = {
  CSE:{1:['Mathematics I','Physics','Chemistry','Programming in C'],2:['Mathematics II','Data Structures','Digital Logic','Discrete Mathematics'],3:['Algorithms','Operating Systems','Computer Networks','Database Systems'],4:['Software Engineering','Web Technologies','Machine Learning','Compiler Design'],5:['Cloud Computing','Cyber Security','Mobile Computing','Big Data'],6:['AI','Blockchain','IoT','Project Management'],7:['Elective I','Elective II','Seminar','Internship'],8:['Project Work','Viva','Placement Training']},
  ECE:{1:['Mathematics I','Physics','Chemistry','Basic Electronics'],2:['Mathematics II','Circuit Theory','Signals and Systems','Digital Electronics'],3:['Analog Circuits','Microprocessors','Control Systems','Communication Systems'],4:['VLSI Design','Embedded Systems','Antenna Theory','Optical Communication'],5:['Wireless Communication','Radar Systems','DSP','Electromagnetic Theory'],6:['Satellite Communication','Mobile Communication','AI in Electronics','Project'],7:['Elective I','Elective II','Seminar','Internship'],8:['Project Work','Viva','Placement Training']},
  ME:{1:['Mathematics I','Physics','Chemistry','Engineering Mechanics'],2:['Mathematics II','Thermodynamics','Fluid Mechanics','Materials Science'],3:['Heat Transfer','Manufacturing Processes','Dynamics','CAD'],4:['Machine Design','Automotive Engineering','Robotics','Vibration Analysis'],5:['Finite Element Analysis','Control Systems','Energy Systems','Project'],6:['Advanced Manufacturing','Mechatronics','Quality Control','Internship'],7:['Elective I','Elective II','Seminar','Research'],8:['Project Work','Viva','Placement Training']},
  CE:{1:['Mathematics I','Physics','Chemistry','Engineering Drawing'],2:['Mathematics II','Structural Analysis','Geotechnical Engineering','Surveying'],3:['Concrete Technology','Transportation Engineering','Water Resources','Environmental Engineering'],4:['Steel Structures','Foundation Engineering','Hydraulics','Construction Management'],5:['Earthquake Engineering','Highway Engineering','Waste Management','Project'],6:['Advanced Structures','Urban Planning','GIS','Internship'],7:['Elective I','Elective II','Seminar','Research'],8:['Project Work','Viva','Placement Training']}
};

// --------------------- LOGIN ---------------------
document.getElementById('loginForm')?.addEventListener('submit', function(e){
  e.preventDefault();
  const username = $('username').value.trim();
  const password = $('password').value;
  const role = $('role').value;
  const branch = $('branch')?.value || '';

  if(credentials[role] && credentials[role].username === username && credentials[role].password === password){
    localStorage.setItem('role', role);
    if(branch) localStorage.setItem('branch', branch);
    window.location.href = role + '.html';
  } else {
    $('error').textContent = 'Invalid credentials!';
  }
});

function logout(){
  localStorage.removeItem('role');
  // preserve branch optional — here we'll clear everything for safety
  // localStorage.clear();
  window.location.href = 'index.html';
}

// ----------------- UI helpers -----------------
function showSection(id){
  document.querySelectorAll('.section').forEach(s=>s.classList.add('hidden'));
  const el = document.getElementById(id);
  if(el) el.classList.remove('hidden');
}

// ----------------- FACULTY -----------------
function updateSubjects(){
  const branch = $('branch')?.value;
  const sem = $('sem')?.value;
  const sel = $('subject');
  if(!sel) return;
  sel.innerHTML = '<option value="">Select Subject</option>';
  if(branch && sem && subjectsData[branch] && subjectsData[branch][sem]){
    subjectsData[branch][sem].forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o);
    });
  }
}
function clearForm(){
  ['studentName','usn','marks'].forEach(id => { if($(id)) $(id).value = ''; });
}
function getMarksArray(){
  try { return JSON.parse(localStorage.getItem('marks') || '[]'); } catch(e) { return []; }
}
function saveMarksArray(arr){ localStorage.setItem('marks', JSON.stringify(arr)); }

function addMarks(){
  const branch = $('branch')?.value;
  const subject = $('subject')?.value;
  const studentName = $('studentName')?.value.trim();
  const usn = $('usn')?.value.trim();
  const sem = $('sem')?.value;
  const marks = $('marks')?.value;

  if(!branch || !subject || !studentName || !usn || !sem){
    alert('Please fill required fields.');
    return;
  }

  const arr = getMarksArray();
  arr.push({ branch, subject, studentName, usn, sem: String(sem), marks: String(marks || '0') });
  saveMarksArray(arr);
  alert('Marks uploaded!');
  clearForm();
  loadMarksList();
}

function loadMarksList(){
  const container = $('marksList');
  if(!container) return;
  const arr = getMarksArray();
  // store copy for search
  window.__FACULTY_MARKS = arr;
  container.innerHTML = arr.map((m, i) => `
    <div class="mark-item" data-index="${i}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${m.studentName}</strong> (${m.usn}) — ${m.branch} — ${m.subject} — Sem ${m.sem}
        </div>
        <div class="controls">
          <input type="number" value="${m.marks}" onchange="facultyEdit(this, ${i})" style="width:90px" />
          <button onclick="facultyDelete(${i})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function facultyEdit(inputElem, idx){
  const newVal = inputElem.value;
  const arr = getMarksArray();
  if(!arr[idx]) return alert('Record not found');
  arr[idx].marks = String(newVal);
  saveMarksArray(arr);
  alert('Updated');
  loadMarksList();
}

function facultyDelete(idx){
  if(!confirm('Delete this mark?')) return;
  const arr = getMarksArray();
  if(idx < 0 || idx >= arr.length) return alert('Invalid index');
  arr.splice(idx,1);
  saveMarksArray(arr);
  loadMarksList();
}

function searchFaculty(){
  const qv = $('facultySearch')?.value.toLowerCase() || '';
  const arr = window.__FACULTY_MARKS || getMarksArray();
  const filtered = arr.filter(m => (m.studentName||'').toLowerCase().includes(qv) || (m.usn||'').toLowerCase().includes(qv));
  const container = $('marksList');
  container.innerHTML = filtered.map((m,i) => `
    <div class="mark-item">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong>${m.studentName}</strong> (${m.usn}) — ${m.branch} — ${m.subject} — Sem ${m.sem}</div>
        <div class="controls">
          <input type="number" value="${m.marks}" onchange="facultyEdit(this, ${i})" style="width:90px" />
          <button onclick="facultyDelete(${i})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}
function refreshFaculty(){ loadMarksList(); }

// ----------------- STUDENT -----------------
function updateSubjectsForStudent(){
  const arr = getMarksArray();
  loadSubjectsForStudent(arr);
}

function loadSubjectsForStudent(arr){
  const sel = $('subjectFilter');
  if(!sel) return;
  sel.innerHTML = '<option value="">All Subjects</option>';
  const subs = [...new Set((arr || []).map(m => m.subject))];
  subs.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o); });
}
function checkResult() {
    const branch = document.getElementById("branch_student").value;
    const usn = document.getElementById("usn_student").value.trim();
    const sem = document.getElementById("sem_student").value;
    const subjectFilter = document.getElementById("subjectFilter").value;

    if (!branch || !usn || !sem) {
        alert("Please fill Branch, USN, and Semester.");
        return;
    }

    const marks = JSON.parse(localStorage.getItem("marks") || "[]");

    let result = marks.filter(m =>
        m.branch === branch &&
        m.usn === usn &&
        String(m.sem) === String(sem)
    );

    if (subjectFilter)
        result = result.filter(m => m.subject === subjectFilter);

    if (result.length === 0) {
        document.getElementById("resultDisplay").innerHTML = "<p>No result found.</p>";
        window.__LAST_RESULT = null;
        return;
    }

    // Only one name & one USN
    const studentName = result[0].studentName;

    // Calculations
    const total = result.reduce((sum, r) => sum + parseInt(r.marks), 0);
    const percentage = (total / result.length).toFixed(2);
    const grade = percentage >= 90 ? "A" :
                  percentage >= 80 ? "B" :
                  percentage >= 70 ? "C" :
                  percentage >= 60 ? "D" : "F";
    const cgpa = (percentage / 10).toFixed(2);

    // Build table rows
    let rows = result.map(r => `
        <tr>
            <td>${r.subject}</td>
            <td>${r.marks}</td>
        </tr>
    `).join("");

    rows += `
        <tr class="summary-row"><td>Total</td><td>${total}</td></tr>
        <tr class="summary-row"><td>Percentage</td><td>${percentage}%</td></tr>
        <tr class="summary-row"><td>Grade</td><td>${grade}</td></tr>
        <tr class="summary-row"><td>CGPA</td><td>${cgpa}</td></tr>
    `;

    // Output
    document.getElementById("resultDisplay").innerHTML = `
        <h3>${studentName} (${usn})</h3>
        <h4>Branch: ${branch} | Semester: ${sem}</h4>

        <table class="result-table">
            <thead>
                <tr><th>Subject</th><th>Marks</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    // Save for PDF
    window.__LAST_RESULT = {
        student: studentName,
        usn,
        branch,
        sem,
        rows: result,
        total,
        percentage,
        grade,
        cgpa
    };
}


function downloadPDF() {
    const data = window.__LAST_RESULT;
    if (!data) return alert("Please check result first.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(18);
    doc.text("Student Result Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Name: ${data.student}`, 14, 30);
    doc.text(`USN: ${data.usn}`, 14, 36);
    doc.text(`Branch: ${data.branch}`, 14, 42);
    doc.text(`Semester: ${data.sem}`, 14, 48);

    // Table header
    let y = 60;
    doc.setFontSize(13);
    doc.text("Subject", 14, y);
    doc.text("Marks", 170, y);

    doc.line(14, y + 2, 195, y + 2);
    y += 10;

    // Subject rows
    data.rows.forEach(r => {
        doc.text(r.subject, 14, y);
        doc.text(String(r.marks), 170, y);
        y += 8;

        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // Summary
    y += 6;
    doc.line(14, y, 195, y);
    y += 10;

    doc.text(`Total: ${data.total}`, 14, y);    y += 8;
    doc.text(`Percentage: ${data.percentage}%`, 14, y);    y += 8;
    doc.text(`Grade: ${data.grade}`, 14, y);    y += 8;
    doc.text(`CGPA: ${data.cgpa}`, 14, y);

    doc.save(`${data.usn}_Result.pdf`);
}


// ----------------- ADMIN -----------------
function populateAdminSubjects(){
  const branch = $('adminBranch')?.value || '';
  const sem = $('adminSem')?.value || '';
  const arr = getMarksArray();
  const filtered = arr.filter(m => (!branch || m.branch === branch) && (!sem || String(m.sem) === String(sem)));
  const subjects = [...new Set(filtered.map(m => m.subject))];
  const sel = $('adminSubject');
  if(!sel) return;
  sel.innerHTML = '<option value="">All Subjects</option>';
  subjects.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o); });
}

function filterAdmin(){
  const branch = $('adminBranch')?.value || '';
  const sem = $('adminSem')?.value || '';
  const subject = $('adminSubject')?.value || '';
  const search = ($('adminSearch')?.value || '').toLowerCase();
  let arr = getMarksArray();
  arr = arr.filter(m => (!branch || m.branch === branch) && (!sem || String(m.sem) === String(sem)) && (!subject || m.subject === subject));
  if(search) arr = arr.filter(m => (m.studentName||'').toLowerCase().includes(search) || (m.usn||'').toLowerCase().includes(search));
  renderAdminResults(arr);
}

function renderAdminResults(arr){
  const out = $('adminResults');
  if(!out) return;
  if(!arr || arr.length === 0){ out.innerHTML = '<p>No records found</p>'; return; }
  out.innerHTML = `
    <table class="result-table">
      <thead><tr><th>Name</th><th>USN</th><th>Branch</th><th>Sem</th><th>Subject</th><th>Marks</th></tr></thead>
      <tbody>
        ${arr.map(m => `<tr>
          <td>${m.studentName}</td>
          <td>${m.usn}</td>
          <td>${m.branch}</td>
          <td>${m.sem}</td>
          <td>${m.subject}</td>
          <td>${m.marks}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  `;
}

function searchFacultyAdvanced(){
  const usn = document.getElementById("facultySearchUSN").value.toLowerCase();
  const branch = document.getElementById("facultyBranch").value;
  const sem = document.getElementById("facultySem").value;

  const arr = JSON.parse(localStorage.getItem("marks") || "[]");

  const filtered = arr.filter(m =>
    (!usn || m.usn.toLowerCase().includes(usn)) &&
    (!branch || m.branch === branch) &&
    (!sem || String(m.sem) === String(sem))
  );

  const container = document.getElementById("marksList");

  if(filtered.length === 0){
    container.innerHTML = "<p>No records found</p>";
    return;
  }

  container.innerHTML = filtered.map((m, i) => `
    <div class="mark-item">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${m.studentName}</strong> (${m.usn}) —
          ${m.branch} — ${m.subject} — Sem ${m.sem}
        </div>
        <div>
          <input type="number" value="${m.marks}"
            onchange="facultyEdit(this, ${i})" style="width:80px">
          <button onclick="facultyDelete(${i})">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}


function exportAllCSV(){
  const arr = getMarksArray();
  if(!arr || arr.length === 0) return alert('No data to export');
  const header = ['Name','USN','Branch','Sem','Subject','Marks'];
  const lines = arr.map(m => [m.studentName,m.usn,m.branch,m.sem,m.subject,m.marks].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'marks_export.csv'; document.body.appendChild(a); a.click(); a.remove();
}

function refreshAdmin(){ populateAdminSubjects(); filterAdmin(); }

// ----------------- INIT -----------------
window.onload = function(){
  // preselect stored branch if any
  const stored = localStorage.getItem('branch');
  if(stored){
    if($('branch')) $('branch').value = stored;
    if($('adminBranch')) $('adminBranch').value = stored;
    if($('branch_student')) $('branch_student').value = stored;
  }

  const path = window.location.pathname;
  if(path.includes('faculty.html')){
    updateSubjects();
    loadMarksList();
  }
  if(path.includes('student.html')){
    updateSubjectsForStudent();
  }
  if(path.includes('admin.html')){
    populateAdminSubjects();
    filterAdmin();
    if($('adminBranch')) $('adminBranch').addEventListener('change', populateAdminSubjects);
    if($('adminSem')) $('adminSem').addEventListener('change', populateAdminSubjects);
  }
};
