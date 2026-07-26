const calculateGrade = (obtained, maximum) => {
  if (maximum <= 0) return 'F';
  const percentage = (obtained / maximum) * 100;

  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

module.exports = calculateGrade;
