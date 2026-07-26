const calculateAttendance = (records = []) => {
  const total = records.length;
  if (total === 0) {
    return {
      totalClasses: 0,
      attendedClasses: 0,
      absentClasses: 0,
      lateCount: 0,
      leaveCount: 0,
      percentage: 0.00
    };
  }

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;

  records.forEach(r => {
    switch (r.status) {
      case 'present':
        presentCount++;
        break;
      case 'late':
        lateCount++;
        break;
      case 'absent':
        absentCount++;
        break;
      case 'leave':
        leaveCount++;
        break;
    }
  });

  const attended = presentCount + lateCount;
  // Percentage is calculated out of total non-leave classes, or total classes?
  // Standard educational rule: leave counts are excluded from denominator or treated separately.
  // The prompt says: "Present counts as attended. Late counts as attended. Leave must be shown separately. Absent counts as not attended. Return total classes, attended classes, absent classes, late count, leave count and percentage."
  // So: percentage = (present + late) / (total classes) * 100, or total excluding leaves?
  // Let's use total classes in denominator: (present + late) / (total) * 100, which is standard when total classes represents all lectures scheduled. Let's make sure if total is 0 we handle it.
  const percentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(2)) : 0.00;

  return {
    totalClasses: total,
    attendedClasses: attended,
    absentClasses: absentCount,
    lateCount,
    leaveCount,
    percentage
  };
};

module.exports = calculateAttendance;
