$(function () {
  let $schools = $('#unis');
  function displaySchool(school) {
    $schools.append('<select> <option value='+school.name+'> school.name </option> </select>');
  }
  $.ajax({
    type: 'GET',
    url: 'http://universities.hipolabs.com/search?country=United+States',
    success: function(schools) {
      console.log(schools);
      $.each(schools, function(i, school) {
        displaySchool(school);
      })
    },
    error: function(){
      alert('Schools didnt load');
    }
  });
});
