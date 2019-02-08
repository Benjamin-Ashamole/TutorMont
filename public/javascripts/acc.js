$(document).ready(function() {

    $('body').on('submit', '.vote-up', function(e){
        e.preventDefault();
        console.log("**********");
      });

      $('.user-vote-up').submit(function (e) {
        e.preventDefault();

        let userId = $(this).data('id');
        // $.get('/path', {a:12, b:23}, function(data){})
        // $.post('/path', {a:12}, function(data){})

        console.log('users/' + userId + '/vote-up')
        console.log($)
        console.log($.ajax)
        $.ajax({
          type: 'PUT',
          url: userId + '/vote-up',
          success: function(data) {
            console.log("voted up!");
            console.log("New Vote count:", data);
          },
          error: function(err) {
            console.log(err.messsage);
          }
        });
      });

      $('.user-vote-down').submit(function (e) {
        e.preventDefault();

        let userId = $(this).data('id'); // data-id
        // $(this).attr('data-id')

        $.ajax({
          type: 'PUT',
          url: userId + '/vote-down',
          success: function(data) {
            console.log("voted down!");
            console.log("New Vote count:", data);
          },
          error: function(err) {
            console.log(err.messsage);
          }
        });
      });
});
