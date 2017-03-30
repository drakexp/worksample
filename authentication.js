var TORUS = TORUS || {};

TORUS.AWS = {
  init: function() {
    sjcl.random.startCollectors(); // start entropy collection
    this.signupHelper();
    this.loginHelper();
    this.signupChecker();
    if(window.location.pathname == '/confirmation') {
      this.confirmation();
    }
    if(window.location.pathname == '/newverification') {
      this.resendverification();
    }
    if(window.location.pathname == '/user-profile') {
      if (localStorage.getItem('torusToken') == null) {
        window.location = '/login';
      }
      else {
        this.getUserDetails();
        this.profileUpdate();
      }
    }
    if(window.location.pathname == '/provider-profile') {
      if (localStorage.getItem('torusToken') == null) {
        window.location = '/login';
      }
      else {
        this.getProviderDetails();
        this.providerUpdate();
      }
    }
    if(window.location.pathname.indexOf('/provider-program') > -1) {
      if (localStorage.getItem('torusToken') == null) {
        window.location = '/login'
      }
      else {
        this.verifyProvider();
        this.updateProgramDetails();
        this.updateProgramContacts();
        this.updateProgramApp();
        this.changePImage();
      }
    }
    if(localStorage.getItem('torusToken') != null) {
      if (window.location.pathname =='/login') {
        var logout = (window.location.hash).replace("#",'');
        if (logout == 'logout') {
          this.logout();
        }
        else
          this.loggedinUser();
      }
      else 
        this.loggedinUser();
    }
    else if(localStorage.getItem('torusToken') == null && window.location.pathname.indexOf('/program/') > -1) {
      $('#apply').removeClass('hidden');
      $('#apply2').removeClass('hidden');
    }
    this.forgotpassword();
    this.updateWishlistHelper();
    var wishlistString;
  },


  signupHelper: function() {
    var self = this;
    $("form[name=signup]").on("submit", function (e) {
      e.preventDefault();
      self.signup()
    });
  },

  signupChecker: function() {
    $('input#signupemail, input#signupemail2').on("keyup", function(e) {
      if ($('input#signupemail2').val() == "") {
        $('#emailX2').addClass('hidden');
        $('#emailcheck2').addClass('hidden');
      }
      if ($('input#signupemail').val() == "") {
        $('#emailX').addClass('hidden');
        $('#emailcheck').addClass('hidden');
        $('#emailX2').addClass('hidden');
        $('#emailcheck2').addClass('hidden');
      }
      else if ($('input#signupemail').val() != "" || $('input#signupemail2').val() != "") {
        if (!validateEmail($('input#signupemail').val())) {
          $('#emailcheck').addClass('hidden');
          $('#emailX').removeClass('hidden');
        }
        else {
          $('#emailX').addClass('hidden');
          $('#emailcheck').removeClass('hidden');
        }
        if ($('input#signupemail').val() != $('input#signupemail2').val()) {
          $('#emailcheck2').addClass('hidden');
          $('#emailX2').removeClass('hidden');
        }
        else {
          $('#emailX2').addClass('hidden');
          $('#emailcheck2').removeClass('hidden');
        }
      }
    });

    $('input#signuppassword, input#signuppassword2').on("keyup", function(e) {
      if ($('input#signuppassword2').val() == "") {
        $('#pwX2').addClass('hidden');
        $('#pwcheck2').addClass('hidden');
      }
      if ($('input#signuppassword').val() == "") {
        $('#pwX').addClass('hidden');
        $('#pwcheck').addClass('hidden');
        $('#pwX2').addClass('hidden');
        $('#pwcheck2').addClass('hidden');
      }
      else if ($('input#signuppassword').val() != "" || $('input#signuppassword2').val() != "") {
        if (!validatePassword($('input#signuppassword').val())) {
          $('#pwcheck').addClass('hidden');
          $('#pwX').removeClass('hidden');
        }
        else {
          $('#pwX').addClass('hidden');
          $('#pwcheck').removeClass('hidden');
        }
        if ($('input#signuppassword').val() != $('input#signuppassword2').val()) {
          $('#pwcheck2').addClass('hidden');
          $('#pwX2').removeClass('hidden');
        }
        else {
          $('#pwX2').addClass('hidden');
          $('#pwcheck2').removeClass('hidden');
        }
      }
    });

    function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    };

    function validatePassword(pw) {
      var re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
      return re.test(pw);
    };
  },

  signup: function(callback) {
    var self = this;
    $('.error').addClass('hidden');

    // require terms of use to be accepted at sign up
    if ($('input#check-terms:checked').length == 0) {
      $('p#terms-error').removeClass('hidden');
      if(callback)
        callback(false);
      return false;
    }

    var email = document.getElementById("signupemail").value.toLowerCase();
    var name = $('input#fullname').val();
    // check if user filled name field
    if(name.length == 0) {
      $('input#fullname').focus();
      $('span#name-blank').removeClass('hidden');
      if(callback)
        callback(false);
      return false;
    }
    // check if user filled email field
    if(email.length == 0) {
      $('input#signupemail').focus();
      $('span#email-blank').removeClass('hidden');
      if(callback)
        callback(false);
      return false;
    }
    if(email != document.getElementById("signupemail2").value.toLowerCase()) {
      $('p#emailmatch-error').removeClass('hidden');
      if(callback)
        callback(false);
      return false;
    }

    // check if user filled password field
    if($('input#signuppassword').val().length == 0) {
      $('input#signuppassword').focus();
      $('span#password-blank').removeClass('hidden');
      if(callback)
        callback(false);
      return false;
    }

    if($('input#signuppassword').val() != $('input#signuppassword2').val()) {
      $('p#pwmatch-error').removeClass('hidden');
      if(callback)
        callback(false);
      return false;
    }

    // check if birthday fields are not blank 
    if($('#signupbday > input#birthday-year').val().length == 0 || $('#signupbday > input#birthday-month').val().length == 0  || $('#signupbday > input#birthday-day').val().length == 0) {
      $('#signupbday > input#birthday-month').focus();
      $('span#birthday-blank').removeClass('hidden');
      if(callback)
        callback(false);
      return false;
    }

    // calculate age
    var today = new Date();
    today.setHours(0,0,0,0);

    var bday = new Date($('#signupbday > input#birthday-month').val() + '/' + $('#signupbday > input#birthday-day').val() + '/' + $('#signupbday > input#birthday-year').val());
    bday.setMinutes(bday.getMinutes() + bday.getTimezoneOffset());

    var age = today.getFullYear() - bday.getFullYear();
    var month = today.getMonth() - bday.getMonth();
    if (month < 0 || (month === 0 && today.getDate() > bday.getDate())) {
      age--;
    }
    if (age < 13) {
      $(this).find('input[type="submit"], input[type="submit"] + .small, .button.facebook').hide();
      $('p#birthday-error').removeClass('hidden');
      if(callback)
        callback(false)
      return false;
    }

    var attributeList = [];

    var user_type = '';
    var checklength = $('#usertype input:checkbox:checked').length;
    $.each($('#usertype input:checkbox:checked'), function(index) {  
      if (checklength == 1)
        user_type += $(this).next("label").text();
      else
        user_type += $(this).next("label").text() + ',';
      checklength--;
    });

    var birthday = self.formatDate(bday);

    var userattributes = {
      'email' : email,
      'fullname' : name,
      'birthdate' : birthday,
      'custom:user_type' : user_type,
      'password' : $('input#signuppassword').val()
    }
    userattributes = JSON.stringify(userattributes);

    $.ajax({
      url : '/signup',
      data : {attributes : userattributes},
      type : 'POST',
      success: function(data) {
        if (data != 'True') {
          if(data == 'InvalidPasswordException' || data == 'InvalidParameterException') 
            $('p#password-error').removeClass('hidden');
          else if(data == 'UsernameExistsException') {
            $('p#username-exists').removeClass('hidden');
            if(callback) {
              $('#loginemail').val(email);
              $('#loginpassword').val($('input#signuppassword').val());
              callback(false);
            }
          }
          if(callback) {
            callback(false);
          }
          return false;
        }
        else {
          $.ajax({
            url : '/autoconfirm',
            data : {user : email},
            type : 'POST',
            success: function(data) {
              if (data == 'True') {
                $.ajax({
                  url : '/authuser',
                  data : {user : email, password : $('input#signuppassword').val()},
                  type : 'GET',
                  success: function(data) {
                    if (data.response == true) {
                      var token = sjcl.encrypt('hello', data.code)
                      localStorage.setItem('torusToken', token);
                      var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
                      $.ajax({
                        url : '/login',
                        data : {accessToken : token},
                        type : 'GET',
                        success: function(data) {
                          if(callback) {
                            self.loggedinUser();
                            callback(true)
                          }
                          else
                            window.location = '/user-profile';
                          return;
                        }
                      });
                    }
                  }
                })
              }
            }
          })
        }
      }
    });
    if(callback)
      callback(false)
    return false;
  },

  formatDate: function(date) {
    var month = (1 + date.getMonth()).toString();
    var day = date.getDate().toString();
    var year = date.getFullYear();
    if (month.length < 2) 
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    return month + '/' + day + '/' + year;
  },

  confirmation: function() {
    var self = this;
    $('form[name="confirmation"]').on('submit', function(e) {
      $('.error').addClass('hidden');

      $.ajax({
        url : '/confirmation',
        data : {verifykey : $('input[name=verifykey]').val(), user : $("input#confirmationemail").val().toLowerCase()},
        type : 'POST',
        success: function(data) {
          if (data != 'True') {
            if(data == 'CodeMismatchException' || data == 'InvalidParameterException')
              $('#invalidcode').removeClass('hidden');
            else if (data == 'ExpiredCodeException')
              $('#codeexpired').removeClass('hidden');
            return false;
          }
          else {
            $.ajax({
              url : '/authuser',
              data : {user : $("input#confirmationemail").val().toLowerCase(), password : $('input#confirmationpassword').val()},
              type : 'GET',
              success: function(data) {
                if (data.response == true) {
                  var token = sjcl.encrypt('hello', data.code)
                  localStorage.setItem('torusToken', token);
                  var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
                  $.ajax({
                    url : '/login',
                    data : {accessToken : token},
                    type : 'GET',
                    success: function(data) {
                      data = JSON.parse(data);
                      $("#verifyinstructions").hide();
                      $('#submit').hide();
                      $('#emailfield').hide();
                      $('#passwordfield').hide();
                      $('#verifyfield').hide();
                      $('#verified').removeClass('hidden');
                      if (data['provider'] == true)
                        window.location = '/provider-profile';
                      else if (data['provider']== false) 
                        window.location = '/user-profile';
                    }
                  })
                }
                else {
                  if(data.code == 'NotAuthorizedException')
                    $('#verifiedwrongpw').removeClass('hidden');
                  $("#verifyinstructions").hide();
                  $('#submit').hide();
                  $('#emailfield').hide();
                  $('#passwordfield').hide();
                  $('#verifyfield').hide();
                  return false;
                }
              }
            })
          }
        }
      })
      return false;
    });
  },

  resendverification: function () {
    var self = this;
    $("form[name=newverification]").on("submit", function(e) {
      e.preventDefault();
      $('.error').addClass('hidden');
      
      $.ajax({
        url : '/newverification',
        data : {user : $("input#newverifyemail").val().toLowerCase()},
        type : 'POST',
        success: function(data) {
          if (data != 'False')
            window.location = '/confirmation';
          else {
            if (data == 'ResourceNotFoundException')
              $('#username-error').removeClass('hidden');
            return false;
          }
        }
      })
      return false;
    });
  },

  loginHelper: function() {
    var self = this;
    $("form[name=login]").on("submit", function (e) {
      e.preventDefault();
      self.login()
    });
  },

  login: function(callback) {
    var self = this;
    $('.error').addClass('hidden');
    // check if user filled email field
    if($('input#loginemail').val().length == 0) {
      $('input#loginemail').focus();
      $('span#email-blank').removeClass('hidden');
      if(callback) 
        callback(false);
      return false;
    }

    // check if user filled password field
    if($('input#loginpassword').val().length == 0) {
      $('input#loginpassword').focus();
      $('span#password-blank').removeClass('hidden');
      if(callback) 
        callback(false);
      return false;
    }

    $.ajax({
      url : '/authuser',
      data : {user : $('input#loginemail').val().toLowerCase(), password : $('input#loginpassword').val()},
      type : 'GET',
      success: function(data) {
        if (data.response != false) {
          var token = sjcl.encrypt('hello', data.code)
          localStorage.setItem('torusToken', token);
          var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
          $.ajax({
            url : '/login',
            data : {accessToken : token},
            type : 'GET',
            success: function(data) {
              data = JSON.parse(data);
              var loginpage = false;
              if (window.location.pathname == '/login') {
                loginpage = true;
              }
              if (data['provider'] == true && loginpage)
                window.location = '/provider-profile';
              else if (data['provider']== false && loginpage) 
                window.location = '/user-profile';
              else if (!loginpage) {
                if (callback)
                  callback(true, data['provider']);
                return;
              }
            }
          });
        }
        else {
          if(data.code == 'UserNotConfirmedException') {
            if(callback) {
              $.ajax({
                url : '/autoconfirm',
                data : {user : $('input#loginemail').val().toLowerCase()},
                type : 'POST',
                success: function(data) {
                  if (data == 'True') {
                    $.ajax({
                      url : '/authuser',
                      data : {user : $('input#loginemail').val().toLowerCase(), password : $('input#loginpassword').val()},
                      type : 'GET',
                      success: function(data) {
                        var token = sjcl.encrypt('hello', data)
                        localStorage.setItem('torusToken', token);
                        var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
                        $.ajax({
                          url : '/login',
                          data : {accessToken : token},
                          type : 'GET',
                          success: function(data) {
                            self.loggedinUser();
                            callback(true)
                            return;
                          }
                        });
                      }
                    })

                      // onFailure: function(err) {
                      //   if(err.name == 'UserNotConfirmedException') {
                      //     if(callback)
                      //       callback('unverifiedlogin')
                      //     else
                      //       $('p#not-confirmed').removeClass('hidden');
                  }
                }
              });
              // callback('unverifiedlogin')
            }
            else
              $('p#not-confirmed').removeClass('hidden');
          }
          else if(data.code == 'NotAuthorizedException')
            $('p#wrongidorpassword').removeClass('hidden');
          else if(data.code == 'UserNotFoundException')
            $('p#usernotfound').removeClass('hidden');
          if(callback)
            callback(false);
          return false;
        }
      }
    })
    if(callback)
      callback(false);
    return false;
  },

  loggedinUser: function() {
    var self = this;
    // validate token
    self.validToken(localStorage.getItem('torusToken'),function(result) {
      // if user is logged in with valid access token
      if(result == true) {
        var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
        $.ajax({
          url : '/login',
          data : {accessToken : token},
          type : 'GET',
          success: function(data) {
            data = JSON.parse(data);
            if(window.location.pathname =='/login') {
              if(data['provider'] == true)
                window.location = '/provider-profile';
              else
                window.location = '/user-profile';
            }
            if(data['provider'] == true) {
              $('#profileli').removeClass('hidden');
              $('#loginli').addClass('hidden');
              $('#signupli').addClass('hidden');
              // change login href to provider-profile
              $('#profilelink').attr('href', '/provider-profile');
              $('#profilelink').text(data['username'])
              // unhide logout 
              $('#logout').removeClass('hidden');
              if(window.location.pathname.indexOf('/program/') > -1) {
                $('#apply').addClass('hidden');
                $('#apply2').addClass('hidden');
              }
            }
            else {
              $('#profileli').removeClass('hidden');
              $('#loginli').addClass('hidden');
              $('#signupli').addClass('hidden');
              // change login href to user-profile
              $('#profilelink').attr('href', '/user-profile');
              $('#profilelink').text(data['username'])
              // unhide logout 
              $('#logout').removeClass('hidden');
              if(window.location.pathname.indexOf('/program/') > -1) {
                $('#apply').removeClass('hidden');
                $('#apply2').removeClass('hidden');
              }
            }
          }
        });
      }
      else {
        if(window.location.pathname.indexOf('/program/') > -1) {
          $('#apply').removeClass('hidden');
          $('#apply2').removeClass('hidden');
        }
        if(localStorage.getItem('torusToken') != null) {
          localStorage.removeItem('torusToken');
        }
      }
    });
  },

  getTempDetails: function(user) {
    var self = this;
    $.ajax({
      url : '/user-profile',
      data : {username : user},
      type : 'GET',
      success: function(data) {
        userdata = data.attributes;
        userdata = JSON.parse(userdata)
        // update details
        $('#welcomeuser').text('Welcome, ' + userdata['name']);
        $('#profilefullname').val(userdata['name']);
        $('#profileemail').val(userdata['email']);
        var bday = userdata['birthdate'].split('/');
        $('input[id=birthday-month]').val(bday[0]);
        $('input[id=birthday-day]').val(bday[1]);
        $('input[id=birthday-year]').val(bday[2]);
        //phone
        if(userdata['phone_number'] != null) {
          $('input[id=phone]').val(userdata['phone_number'].substring(2));
        }
        // schools
        schools = data.schools
        for(var i = 0; i < schools.length; i++) {
          var opt = document.createElement('option');
          opt.value = schools[i].name;
          opt.innerHTML = schools[i].name;
          document.getElementById('school').appendChild(opt);
          if(userdata['custom:school'] != null) {
            if(userdata['custom:school'] == opt.value)
              opt.selected = true;
          }
        }

        //address
        if(userdata['address'] != null) {
          $('input[id=address]').val(userdata['address']);
        }
        //city
        if(userdata['custom:city'] != null) {
          $('input[id=city]').val(userdata['custom:city']);
        }
        //state
        if(userdata['custom:state'] != null) {
          var stateselect = document.getElementById('state');
          for (var i = 0; i < stateselect.options.length; i++) {
            if (stateselect.options[i].text === userdata['custom:state']) {
              stateselect.selectedIndex = i;
              break;
            }
          }
        }

        //zip
        if(userdata['custom:zipcode'] != null) {
          $('input[id=zipcode]').val(userdata['custom:zipcode']);
        }
        //goals
        if(userdata['custom:user_goals'] != null) {
          user_goals = userdata['custom:user_goals'].split(',');
          for(var i = 0; i < user_goals.length; i++) {
            if(user_goals[i].indexOf('other') == -1 && user_goals[i] != '') {
              $("input[value="+user_goals[i]+"]").prop("checked", "checked");
            }
        
            else if(user_goals[i].indexOf('other') == 0) {
              var other = user_goals[i].split('+');
              $("input[value="+other[0]+"]").prop("checked", "checked");
              if(other[1]!=null || other[1]!= '')
                $("#otherinput").val(other[1]);
            }
          }
        }
        //gender
        if(userdata['custom:gender'] != null) {
          $('input[id=gender]').val(userdata['custom:gender']);
        }
        //race
        if(userdata['custom:race'] != null) {
          $('input[id=race]').val(userdata['custom:race']);
        }
        //lunch requirement
        if(userdata['custom:lunch'] != null) {
          var lunchoption = userdata['custom:lunch'];
          if(lunchoption == 'YES') {
            $('input[id=lunchY]').prop('checked', 'checked')
          }
          else if(lunchoption == 'NO') {
            $('input[id=lunchN]').prop('checked', 'checked')
          }
        }
      }
    });
  },

  getUserDetails: function() {
    var self = this;
    // validate token and get details 
    self.validToken(localStorage.getItem('torusToken'),function(result) {
      // if token valid
      if(result == true) {
        var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
        $.ajax({
          url : '/user-profile',
          data : {accessToken : token},
          type : 'GET',
          success: function(data) {
            userdata = data.attributes;
            userdata = JSON.parse(userdata)
            // update details
            $('#welcomeuser').text('Welcome, ' + userdata['name']);
            $('#profilefullname').val(userdata['name']);
            $('#profileemail').val(userdata['email']);
            var bday = userdata['birthdate'].split('/');
            $('input[id=birthday-month]').val(bday[0]);
            $('input[id=birthday-day]').val(bday[1]);
            $('input[id=birthday-year]').val(bday[2]);
            //phone
            if(userdata['phone_number'] != null) {
              $('input[id=phone]').val(userdata['phone_number'].substring(2));
            }

            //address
            if(userdata['address'] != null) {
              $('input[id=address]').val(userdata['address']);
            }
            //city
            if(userdata['custom:city'] != null) {
              $('input[id=city]').val(userdata['custom:city']);
            }
            //state
            if(userdata['custom:state'] != null) {
              var stateselect = document.getElementById('state');
              for (var i = 0; i < stateselect.options.length; i++) {
                if (stateselect.options[i].text === userdata['custom:state']) {
                  stateselect.selectedIndex = i;
                  break;
                }
              }
            }

            //zip
            if(userdata['custom:zipcode'] != null) {
              $('input[id=zipcode]').val(userdata['custom:zipcode']);
            }
            //goals
            if(userdata['custom:user_goals'] != null) {
              user_goals = userdata['custom:user_goals'].split(',');
              for(var i = 0; i < user_goals.length; i++) {
                if(user_goals[i].indexOf('other') == -1 && user_goals[i] != '') {
                  $("input[value="+user_goals[i]+"]").prop("checked", "checked");
                }
            
                else if(user_goals[i].indexOf('other') == 0) {
                  var other = user_goals[i].split('+');
                  $("input[value="+other[0]+"]").prop("checked", "checked");
                  if(other[1]!=null || other[1]!= '')
                    $("#otherinput").val(other[1]);
                }
              }
            }
            //gender
            if(userdata['custom:gender'] != null) {
              $('input[id=gender]').val(userdata['custom:gender']);
            }
            //race
            if(userdata['custom:race'] != null) {
              $('input[id=race]').val(userdata['custom:race']);
            }
            //lunch requirement
            if(userdata['custom:lunch'] != null) {
              var lunchoption = userdata['custom:lunch'];
              if(lunchoption == 'YES') {
                $('input[id=lunchY]').prop('checked', 'checked')
              }
              else if(lunchoption == 'NO') {
                $('input[id=lunchN]').prop('checked', 'checked')
              }
            }
            //censent text
            if(userdata['custom:text'] != null) {
              var text = userdata['custom:text'];
              if(text == 'YES') {
                $('input[id=text-consent]').prop('checked', 'checked')
              }
              else if(text == 'NO') {
                $('input[id=text-consent]').prop('checked', 'checked')
              }
            }
            schools = data.schools
            for(var i = 0; i < schools.length; i++) {
              var opt = document.createElement('option');
              opt.value = schools[i].name;
              opt.innerHTML = schools[i].name;
              document.getElementById('school').appendChild(opt);
              if(userdata['custom:school'] != null) {
                if(userdata['custom:school'] == opt.value)
                  opt.selected = true;
              }
            }

              
            var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
            // populate wishlist and applied programs
            $.ajax({
              url : '/wish-listget',
              data : {accessToken : token},
              type : 'GET',
              success: function(data) {
                if (data != 'False') {
                  var wishPrograms = data.wishlistPrograms;
                  var appPrograms = data.appliedPrograms;
                  $('#wishlist_results').empty();
                  $('#applied_results').empty();
                  if (wishPrograms.length > 0) {
                    for (var i = 0; i < wishPrograms.length; i++) {
                      var wishLocation = self.locationMatch(wishPrograms[i], data.wishlistLocations);
                      self.appendPrograms(wishPrograms[i], wishLocation, '#wishlist_results');
                    }
                    self.removeWishlist();
                  }
                  else 
                    $('#wishlist_results').append('<p>No programs in wishlist</p>')

                  if (appPrograms.length > 0) {
                    for (var i = 0; i < appPrograms.length; i++) {
                      var appLocation = self.locationMatch(appPrograms[i], data.appliedLocations);
                      self.appendPrograms(appPrograms[i], appLocation, '#applied_results');
                    }
                  }
                  else{
                    $('#applied_results').append('<p>No programs in applied programs</p>') 
                  }
                }                 
              } // inner success
            }) // inner ajax
          } // outer success
        }) // outer ajax
      } // if
      // token invalid redirect to login page
      else
        window.location = '/login';
    });
  },

  getProviderDetails: function() {
    var self = this;
    // validate token and get details 
    self.validToken(localStorage.getItem('torusToken'),function(result) {
      // if token valid
      if(result == true) {
        var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
        $.ajax({
          url : '/user-profile',
          data : {accessToken : token},
          type : 'GET',
          success: function(data) {
            userdata = data.attributes;
            userdata = JSON.parse(userdata)
            // update details
            $('#welcomeprovider').text('Welcome, ' + userdata['name']);
            $('#providername').text(userdata['name']);
            $('#email').text(userdata['email']);
            $('#emailupdate').val(userdata['email']);

            $.ajax({
              url : '/provider-profile',
              data : {orgname : userdata['name']},
              type : 'GET',
              success: function(data) {
                var org = data.org;
                var loc = data.loc;
                var programs = data.programs;
                // organization details
                if (org != null) {
                  if (org['mission'] != null || org['mission'] != '') {
                    $('#mission').text(org['mission']);
                    $('#missionupdate').val(org['mission']);
                  }
                  if (org['phone_number'] != null || org['phone_number'] != '') {
                    $('#phonenumber').text(org['phone_number']);
                    $('#phone_number').val(org['phone_number']);
                  }

                  if (org['url'] != null || org['url'] != null) {
                    var org_url = org['url'];
                    if (org_url.split('http://').length == 2)
                      org_url = org_url.split('http://')[1];
                    else if (org_url.split('https://').length == 2)
                      org_url = org_url.split('https://')[1];
                    $('#orgurl').text(org_url);
                    $('#url').val(org_url);
                  }
                  
                  if(org['facebook'] != null) {
                    var facebook_url = org['facebook'];
                    if (facebook_url.split('http://').length == 2)
                      facebook_url = facebook_url.split('http://')[1];
                    else if (facebook_url.split('https://').length == 2)
                      facebook_url = facebook_url.split('https://')[1];
                    $('#facebookurl').text(facebook_url);
                    $('#facebook').val(facebook_url);
                  }

                  if(org['twitter'] != null) {
                    var twitter_url = org['twitter'];
                    if (twitter_url.split('http://').length == 2)
                      twitter_url = twitter_url.split('http://')[1];
                    else if (twitter_url.split('https://').length == 2)
                      twitter_url = twitter_url.split('https://')[1];
                    $('#twitterurl').text(twitter_url);
                    $('#twitter').val(twitter_url);
                  }
                  if(data.orgupdated != null) {
                    $('#updatedon').text("Last updated on: " + data.orgupdated)
                  }
                }

                // location details
                if (loc != null) {
                  if (loc['address_line_1'] != null) {
                    $('#addressline1').text(loc['address_line_1']);
                    $('#address_line_1').val(loc['address_line_1']);
                  }
                  if (loc['address_line_2'] != null) {
                    $('#addressline2').text(loc['address_line_2']);
                    $('#address_line_2').val(loc['address_line_2']);
                  }
                  var addressline3 = ''
                  if (loc['city'] != null) {
                    addressline3 += loc['city'];
                    $('#city').val(loc['city']);
                  }
                  if (loc['state'] != null) {
                    if (addressline3 == '')
                      addressline3 += loc['state'];
                    else
                      addressline3 += ', ' + loc['state'];
                    var stateselect = document.getElementById('state');
                    for (var i = 0; i < stateselect.options.length; i++) {
                      if (stateselect.options[i].text === loc['state']) {
                        stateselect.selectedIndex = i;
                        break;
                      }
                    }
                  }
                  if (loc['zip_code'] != null) {
                    if (addressline3 == '') 
                      addressline3 += loc['zip_code'];
                    else
                      addressline3 += ', ' + loc['zip_code']
                    $('#zip_code').val(loc['zip_code']);
                  }
                  if (addressline3 != '') 
                    $('#addressline3').text(addressline3);
                }

                // programs 
                if (programs != null) {
                  $('#provider_programs').empty();
                  $('#provider_programs').append(
                    '<thead> \
                      <tr> \
                        <th>Program name</th> \
                      </tr> \
                    </thead> \
                    <tfoot> \
                      <tr> \
                        <td colspan="3"> \
                          <p class="small">Need to add or remove a program? Change a program\'s name? \
                          <a href="mailto:hello@torusteens.com">Please email us at hello@torusteens.com to make that change.</a> \
                          </p> \
                        </td> \
                      </tr> \
                    </tfoot>'  
                  )

                  for (var i = 0; i < programs.length; i++) {
                    self.appendProvPrograms(programs[i]);
                  }
                }
              }
            })
          }
        })
      }
      else
        window.location = '/login';
    })
  },
  
  // check if valid provider and if program is related to organization
  verifyProvider: function() {
    $('#detailssave').hide();
    $('#applicationsave').hide();
    $('#contactsave').hide();
    var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
    $.ajax({
      url : '/provider-program/' + provProgID,
      data : {accessToken : token},
      type : 'GET',
      success: function(data) {
        if(data == 'True') {
          $('#detailssave').show();
          $('#applicationsave').show();
          $('#contactsave').show();          
        }  
        else {
          window.location = '/provider-profile'
        }
      }
    })
  },

  updateProgramDetails: function() {
    $('form[name=program-details]').on("submit", function(e) {
      e.preventDefault();
      $('.alert').addClass("hidden");

      // check cats and subcats
      var atLeastOne = 0;
      if ($('#category1').val() != 'Choose one category' && $('#subcategory1').val() != null)
        atLeastOne++;
      if ($('#category2').val() != 'Choose one category' && $('#subcategory2').val() != null)
        atLeastOne++;
      if ($('#category3').val() != 'Choose one category' && $('#subcategory3').val() != null)
        atLeastOne++;
      if(atLeastOne == 0) {
        $('#catsubcat').removeClass('hidden');
        return false;
      }
      // gender 
      var gender = '';
      if ($('#genderM').is(':checked') && $('#genderF').is(':checked'))
        gender = '';
      else if($('#genderM').is(':checked'))
        gender = 'M';
      else if ($('#genderF').is(':checked'))
        gender = 'F';
      
      // program type
      var program_type = ''
      var inSchoolBool = "False";
      if ($('#typeInSchool').is(':checked')) {
        program_type += 'in school+';
        inSchoolBool = "True";
      }
      if ($('#typeAfterSchool').is(':checked'))
        program_type += 'after school+';
      if ($('#typeWeekday').is(':checked'))
        program_type += 'weekday+';
      if ($('#typeWeekend').is(':checked'))
        program_type += 'weekend+';
      if ($('#typeSummer').is(':checked'))
        program_type += 'summer';
      if (program_type != '') {
        program_type = program_type.split('+');
        program_type = program_type.filter(String);
        program_type = program_type.join(',');
      }
      // special
      var food = "False";
      if ($('#food').is(':checked'))
        food = "True";

      var immigrant_services = "False";
      if ($('#immigrant_services').is(':checked'))
        immigrant_services = "True";

      var juvenile_justice = "False";
      if ($('#juvenile_justice').is(':checked'))
        juvenile_justice = "True";

      var homeless_in_crisis = "False";
      if ($('#homeless_in_crisis').is(':checked'))
        homeless_in_crisis = "True";

      var foster_care = "False";
      if ($('#foster_care').is(':checked'))
        foster_care = "True";            

      var low_income_at_risk = "False";
      if ($('#low_income_at_risk').is(':checked'))
        low_income_at_risk = "True";

      var lgbtq = "False";
      if ($('#lgbtq').is(':checked'))
        lgbtq = "True";

      var physical_disability = "False";
      if ($('#physical_disability').is(':checked'))
        physical_disability = "True";

      var substance_abuse = "False";
      if ($('#substance_abuse').is(':checked'))
        substance_abuse = "True";

      var mental_health = "False";
      if ($('#mental_health').is(':checked'))
        mental_health = "True";

      var categories = [];
      $('select[name=categories] option:selected').each(function() {
        if (this.value != "" && this.value != "Choose one category")
          categories.push(this.value)
      })

      var subcategories = [];
      $('select[name=subcategories] option:selected').each(function() {
        if (this.value == "other") {
          var subcat = $(this).parent().attr('id');
          var select = subcat.match(/\d+/);
          var catid = 'select#category' + select[0];
          subcategories.push($(catid).val() + '+other');
        }
        else if (this.value != "") {
          subcategories.push(this.value);
        }
      })
      
      var costSliderVal = "";
      switch($('input[name=cost_slider').val()) {
        case "0":
          costSliderVal = "free";
          break;
        case "1":
          costSliderVal = "low";
          break;
        case "2":
          costSliderVal = "mid";
          break;
        case "3":
          costSliderVal = "high";
          break;
        default:
          costSliderVal = "free";
      }

      var pDetails = {
        'activities' : $('#activities').val(),
        'eligibility' : $('#eligibility').val(),
        'cost' : $('#cost').val(),
        'cost_slider' : costSliderVal,
        'gender' : gender,
        'language' : $('#language').val(),
        'age_min' : $('#age_min').val(),
        'age_max' : $('#age_max').val(),
        'meets' : $('#meets').val(),
        'food_provided' : food,
        'program_type' : program_type,
        'immigrant_services' : immigrant_services,
        'juvenile_justice' : juvenile_justice,
        'homeless_in_crisis' : homeless_in_crisis,
        'foster_care' : foster_care,
        'lgbtq' : lgbtq,
        'physical_disability' : physical_disability,
        'substance_abuse' : substance_abuse,
        'mental_health' : mental_health,
        'categories' : categories,
        'subcategories' : subcategories,
        'tags' : $('input[name=tags]').val(),
        'in_school' : inSchoolBool
      }
      pDetails = JSON.stringify(pDetails);
      $.ajax({
          url : '/provider-program/' + provProgID,
          data : {details : pDetails},
          type : 'POST',
          success: function(data) {
            if(data != 'False') {
              $('#detailssuccess').removeClass("hidden");
            }
            else 
              $('#detailsfailure').removeClass("hidden");
          }  
      })
    });
  },

  changePImage: function() {
    $('#image').change(function(e) {
      e.preventDefault();
      $('.alert').addClass("hidden");
      if (this.files && this.files[0]) {
        // update image on preview
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#programimage').attr('src', e.target.result)
        };
        reader.readAsDataURL(this.files[0]);
        var data = new FormData();
        var img = this.files[0];
        // update image on s3 and link to DB
        // file = this.files[0];
        // var data = new FormData();
        // $.each(this.files[0], function(key, value)
        // {
        //     data.append(key, value);
        // });

        var providername = provProgName.replace(/[^\w\s]/gi, '');
        providername = providername.replace(/ /g , '');
        var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'));
        data.append('image', img);
        data.append('providername', providername)
        $.ajax({
          url : '/uploadimage',
          data : data,
          type : 'POST',
          cache: false,
          dataType: 'json',
          processData: false,
          contentType: false,
          success: function(response) {
            if(data != 'False') {
              // Add image link to DB
              var link = "https://s3.amazonaws.com/torusimages/searchimages/" + providername + ".jpg";
              $.ajax({
                url : '/provider-program/' + provProgID,
                data : {imagelink : link},
                type : 'POST',
                success: function(data) {
                  if(data != 'False') {
                    $('#imagesuccess').removeClass("hidden");
                  }
                  else 
                    $('#imagefailure').removeClass("hidden");
                }  
              })
            }
            else {
              alert('Could not save your image');
            }
          }
        })
        return false;
      }
      return false;
    });
  },

  updateProgramContacts: function() {
    $('#contactsave').on("click", function(e) {
      e.preventDefault();
      $('.alert').addClass("hidden");
      var pContacts = {
        'phone_number' : $('#phone_number').val(),
        'email' : $('#email').val().toLowerCase(),
      }

      pContacts = JSON.stringify(pContacts);
      $.ajax({
          url : '/provider-program/' + provProgID,
          data : {contacts : pContacts},
          type : 'POST',
          success: function(data) {
            if(data != 'False') {
              $('#contactsuccess').removeClass("hidden");
            }
            else 
              $('#contactfailure').removeClass("hidden");
          }  
      })
    })
  },

  updateProgramApp: function() {
    $('form[name=program-application]').on("submit", function(e) {
      $('.alert').addClass('hidden');
      e.preventDefault();
      var pApp = {
        'application_instructions' : $('#application_instructions').val(),
        'how_to_apply' : $('#how_to_apply').val(),
        'application_link' : $('#application_link').val(),
        'deadline' : $('#deadlinedate').val()
      }

      pApp = JSON.stringify(pApp);
      $.ajax({
          url : '/provider-program/' + provProgID,
          data : {application : pApp},
          type : 'POST',
          success: function(data) {
            if(data != 'False') {
              $('#appsuccess').removeClass('hidden');
            }
            else 
              $('#appfailure').removeClass('hidden');
          }  
      })
    })
  },

  profileUpdate: function() {
    var self = this;
    $("form[name=profile]").on("submit", function(e) {
      e.preventDefault();
      $('.error').addClass('hidden');
      // calculate age
      var today = new Date();
      today.setHours(0,0,0,0);
      var bday = new Date($('#birthday-month').val() + '/' + $('#birthday-day').val() + '/' + $('#birthday-year').val());
      bday.setMinutes(bday.getMinutes() + bday.getTimezoneOffset());

      var age = today.getFullYear() - bday.getFullYear();
      var month = today.getMonth() - bday.getMonth();
      if (month < 0 || (month === 0 && today.getDate() > bday.getDate())) {
        age--;
      }
      if (age < 13) {
        $('#birthday-error').removeClass('hidden');
        return false;
      }

      var birthday = self.formatDate(bday);
      var user_goals = '';
      $.each($('#usergoalstop input:checkbox:checked'), function(){            
        user_goals += $(this).val() + ',';
      });
      $.each($('#usergoalsmid input:checkbox:checked'), function(){            
        user_goals += $(this).val() + ',';
      });
      $.each($('#usergoalsbot input:checkbox:checked'), function(){            
        user_goals += 'other+' + $(this).siblings('#otherinput').val();
      });

      // check if name is not blank
      if ($('#profilefullname').val() == '') {
          $('p#no-name').removeClass('hidden');
          return false;
        }

      // check if email is blank
      if ($('#profileemail').val() != '') {
        // test if actual email
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test($('#profileemail').val())) {
          $('p#no-email').removeClass('hidden');
          if (callback)
            callback(false);
          return false;
        }
      }
      else {
        $('p#no-email').removeClass('hidden');
        if (callback)
          callback(false);
        return false;
      }



      var lunch = '';
      if(document.getElementById('lunchY').checked) {
        lunch = "YES";
      }
      else if (document.getElementById('lunchN').checked) {
        lunch = "NO";
      }

      phone = $('#phone').val().replace(/\D/g,'');
      if(phone.length == 10) 
        phone = "+1" + phone;
      else {
        $('#invalid-phone').removeClass('hidden');
        return false;
      }

      var text = '';
      if(document.getElementById('text-consent').checked) {
        text = "YES";
      }
      else {
        text = 'NO'
      }

      var userattributes = {
        'email' : $('#profileemail').val().toLowerCase(),
        'fullname' : $('#profilefullname').val(),
        'phone_number' : phone,
        'birthdate' : birthday,
        'address' : $('#address').val(),
        'custom:city' : $('#city').val(),
        'custom:state' : $('#state').val(),
        'custom:zipcode' : $('#zipcode').val(),
        'custom:user_goals' : user_goals,
        'custom:gender' : $('#gender').val(),
        'custom:race' : $('#race').val(),
        'custom:lunch' : lunch,
        'custom:school' : $('select#school option:selected').val(),
        'custom:text' : text
      }
      userattributes = JSON.stringify(userattributes);
      var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
      $.ajax({
          url : '/user-profile',
          data : {accessToken : token, attributes : userattributes},
          type : 'POST',
          success: function(data) {
            if(data == 'True') {
              self.getUserDetails();
              $('.alert-success').removeClass('hidden');
            }
          }  
      })
      return false;
    });
  },

  providerUpdate: function() {
    var self = this;
    $("form[name=org-info]").on("submit", function(e) {
      e.preventDefault();
      $(".alert").addClass("hidden");
      var stateselect = document.getElementById('state');
      var provattributes = {
        'mission' : $('#missionupdate').val(),
        'addressline1' : $('#address_line_1').val(),
        'addressline2' : $('#address_line_2').val(),
        'city' : $('#city').val(),
        'state' : stateselect.options[stateselect.selectedIndex].text,
        'zipcode' : $('#zip_code').val(),
        'email' : $('#emailupdate').val().toLowerCase(),
        'phone' : $('#phone_number').val(),
        'url' : $('#url').val(),
        'twitter' : $('#twitter').val(),
        'facebook' : $('#facebook').val(),
      }
      provattributes = JSON.stringify(provattributes);
      var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'));
      $.ajax({
        url : '/user-profile',
        data : {accessToken : token},
        type : 'GET',
        success: function(data) {
          userdata = data.attributes;
          userdata = JSON.parse(userdata);
          var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'));
          $.ajax({
            url : '/provider-profile',
            data : {orgname : userdata['name'], attributes: provattributes, accessToken: token},
            type : 'POST',
            success: function(data) {
              if(data == 'True') {
                $(".alert-success").removeClass("hidden");
                self.getProviderDetails();
              }
              else
                $(".alert-danger").removeClass("hidden");
            }
          })
        }
      })
    })
  },

  applicationProfileUpdate: function(appSignUp, callback) {
    var self = this;
    $('.error').addClass('hidden');
    // calculate age
    var today = new Date();
    today.setHours(0,0,0,0);
    var bday = new Date($('#birthday-month').val() + '/' + $('#birthday-day').val() + '/' + $('#birthday-year').val());
    bday.setMinutes(bday.getMinutes() + bday.getTimezoneOffset());
    var age = today.getFullYear() - bday.getFullYear();
    var month = today.getMonth() - bday.getMonth();
    if (month < 0 || (month === 0 && today.getDate() > bday.getDate())) {
      age--;
    }
    if (age < 13) {
      $('p#birthday-error').removeClass('hidden');
      if (callback)
        callback(false);
      return false;
    }

    var birthday = self.formatDate(bday);
    var user_goals = '';
    $.each($('#usergoalstop input:checkbox:checked'), function(){            
      user_goals += $(this).val() + ',';
    });
    $.each($('#usergoalsmid input:checkbox:checked'), function(){            
      user_goals += $(this).val() + ',';
    });
    $.each($('#usergoalsbot input:checkbox:checked'), function(){            
      user_goals += 'other+' + $(this).siblings('#otherinput').val();
    });

    var phone = '';
    if ($('#phone').val() != '') {
      phone = $('#phone').val().replace(/\D/g,'');
      if(phone.length == 10) 
        phone = "+1" + phone;
      else {
        $('p#invalid-phone').removeClass('hidden');
        if (callback)
          callback(false);
        return false;
      }
    }
    else {
      $('p#invalid-phone').removeClass('hidden');
      if (callback)
        callback(false);
      return false;
    } 

    // check if name is not blank
    if ($('#profilefullname').val() == '') {
      $('p#no-name').removeClass('hidden');
      if (callback)
        callback(false);
      return false;
    }

    // check if email is blank
    if ($('#profileemail').val() != '') {
      // test if actual email
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!re.test($('#profileemail').val())) {
        $('p#no-email').removeClass('hidden');
        if (callback)
          callback(false);
        return false;
      }
    }
    else {
      if (callback)
        callback(false);
      return false;
    }


    var lunch = '';
    if(document.getElementById('lunchY').checked) {
      lunch = "YES";
    }
    else if (document.getElementById('lunchN').checked) {
      lunch = "NO";
    }

    var text = '';
    if(document.getElementById('text-consent').checked) {
      text = "YES";
    }
    else {
      text = 'NO'
    }

    var userattributes = {
      'email' : $('#profileemail').val().toLowerCase(),
      'fullname' : $('#profilefullname').val(),
      'phone_number' : phone,
      'birthdate' : birthday,
      'address' : $('#address').val(),
      'custom:city' : $('#city').val(),
      'custom:state' : $('#state').val(),
      'custom:zipcode' : $('#zipcode').val(),
      'custom:user_goals' : user_goals,
      'custom:gender' : $('#gender').val(),
      'custom:race' : $('#race').val(),
      'custom:lunch' : lunch,
      'custom:school' : $('select#school option:selected').val(),
      'custom:text' : text
    }
    userattributes = JSON.stringify(userattributes);
    // if signed up through application modal
    if(appSignUp) {
      $.ajax({
        url : '/user-profile',
        data : {appAttributes : userattributes},
        type : 'POST',
        success: function(data) {
          if(data == 'True') {
            if (callback)
              callback(true);
            return true;
          }
          else {
            alert('Please try updating your profile again');
            if (callback)
              callback(false);
            return false;
          }
        }  
      })
    }
    else if (!appSignUp) {
      var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'));
      $.ajax({
        url : '/user-profile',
        data : {accessToken : token, attributes : userattributes},
        type : 'POST',
        success: function(data) {
          if(data == 'True') {
            if (callback)
              callback(true);
            return true;
          }
          else {
            alert('Please try updating your profile again');
            if (callback)
              callback(false);
            return false;
          }
        }  
      })
    }
    else {
      if (callback)
        callback(false);
      return false;
    }
  },

  applicationForm: function(appSignUp) {
    var otherprog1 = '';
    var otherprog2 = '';
    if($('#other-1').is(':checked')) {
      otherprog1 = $('#other-1').next('label').text();
    }    
    if($('#other-2').is(':checked')) {
      otherprog2 = $('#other-2').next('label').text();
    }

    var programApply = {
      'otherProg1' : otherprog1,
      'otherProg2' : otherprog2,
      'programID' : progID,
      'locationID' : $('#applocation').val(),
      'reason' : $('#interest').val()
    }
    programApply = JSON.stringify(programApply);
    if(appSignUp) {
      $.ajax({
        url : '/user-profile',
        data : {username : $('#profileemail').val().toLowerCase(), application : programApply},
        type : 'POST',
        success: function(data) {
          if(data == 'True')
            return;
          else
            alert('Application to program was unsuccessful');
        }
      })
      return false;
    }
    else {
      var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'));
      $.ajax({
        url : '/user-profile',
        data : {accessToken : token, application : programApply},
        type : 'POST',
        success: function(data) {
          if(data == 'True')
            return;
          else
            alert('Application to program was unsuccessful');
        }  
      })
      return false; 
    }
    return false;
  },

  logout: function() {
    var self = this;
    var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'));
    self.validToken(localStorage.getItem('torusToken') ,function(result) {
      localStorage.removeItem('torusToken');
      // if token valid
      if(result == true) {
        $.ajax({
          url : '/login',
          data : {accessToken : token},
          type : 'POST',
          success: function(data) {
            if(data = 'True') {
              $('#logoutmsg').removeClass('hidden');
              $('#loginli').removeClass('hidden');
              $('#signupli').removeClass('hidden');
              $('#profileli').addClass('hidden');
              $('#logout').addClass('hidden');
            }
            else window.location = '/login'
          }  
        })
      }
      else 
        window.location = '/login'
    });
  },

  forgotpassword: function() {
    var self = this;
    $('.verify').addClass('hidden');
    $('.error').addClass('hidden');

    $("form[name=forgotpwemail]").on("submit", function(e) {
      $('.error').addClass('hidden');
      
      $.ajax({
        url : '/forgotpassword',
        data : {user : document.getElementById("email").value.toLowerCase()},
        type : 'POST',
        success: function(data) {
          console.log(data)
          if(data != 'True') {
            if(data == 'LimitExceededException')
              $('#limit-error').removeClass('hidden');
            else if(data == 'ResourceNotFoundException')
              $('#user-error').removeClass('hidden');
            else if (data == 'UserNotFoundException')
              $('#user-error').removeClass('hidden');
            return false;
          }
          else {
            $('.emailsubmit').addClass('hidden');
            $('.verify').removeClass('hidden');
            $("form[name=newpassword]").on("submit", function(e) {
              $('.error').addClass('hidden');
              $.ajax({
                url : '/forgotpassword',
                data : {user : document.getElementById("email").value.toLowerCase(), verifykey : $('input[name=verifykey]').val(), password : $('input[name=password]').val()},
                type : 'POST',
                success: function(data) {
                  if(data != 'True') {
                    if(data == 'ExpiredCodeException' || data == 'CodeMismatchException' || data == 'InvalidParameterException')
                      $('#invalidcode').removeClass('hidden');
                    else if(data == 'InvalidPasswordException')
                      $('#password-error').removeClass('hidden');
                    return false;
                  }
                  else {
                    $('#passwordsuccess').removeClass('hidden');
                    $('#submit').addClass('hidden');
                  }
                }
              })
              return false;
            });
          }
        }
      })      
      return false;
    });
  },

  updateWishlistHelper: function(e) {
    var self = this;
    $(document).on('click', '.button__wishlist', function(e) {
      e.preventDefault();
      e.stopPropagation();
      wishlistString = $(this).attr('value');
      self.updateWishlist(false, false);
    })
  },

  updateWishlist: function(modalSignUp, modalLogin) {
    var self = this;
    var wishlist = wishlistString.split('+');
    var program_id = wishlist[0];
    var location_id = wishlist[1];
    if(modalSignUp) {
      $.ajax({
        url : '/wish-listget',
        data : {username : document.getElementById("signupemail").value.toLowerCase(), programID : program_id, locationID : location_id},
        type : 'GET',
        success: function(data) {
          if (data != 'False') {
            $.ajax({
              url : '/wish-listpost',
              data : {username : document.getElementById("signupemail").value.toLowerCase(), programID : program_id, locationID : location_id},
              type : 'POST',
              success : function(data) {
                if (data == 'True') {
                  alert('Program added to wishlist!')
                  return;
                }
                else {
                  alert('Failed to add program to wishlist')
                  return;
                }
              }
            })
          }
          else {
            alert('Program already in wishlist')
            return false;
          }
        }
      })  
    }
    else if (modalLogin) {
      $.ajax({
        url : '/wish-listget',
        data : {username : document.getElementById("loginemail").value.toLowerCase(), programID : program_id, locationID : location_id},
        type : 'GET',
        success: function(data) {
          if (data != 'False') {
            $.ajax({
              url : '/wish-listpost',
              data : {username : document.getElementById("loginemail").value.toLowerCase(), programID : program_id, locationID : location_id},
              type : 'POST',
              success : function(data) {
                if (data == 'True') {
                  alert('Program added to wishlist. Please confirm your account to view it')
                  $('p#not-confirmed').removeClass('hidden');
                  $('input#loginsubmit').addClass('hidden');
                  $('#forgotpwlink').addClass('hidden');
                  return;
                }
                else {
                  alert('Failed to add program to wishlist')
                  return;
                }
              }
            })
          }
          else {
            alert('Program already in wishlist. Please confirm your account to view it')
            $('p#not-confirmed').removeClass('hidden');
            $('input#loginsubmit').addClass('hidden');
            $('#forgotpwlink').addClass('hidden');
            return false;
          }
        }
      })       
    }
    else {
      if(localStorage.getItem('torusToken') != null) {
        self.validToken(localStorage.getItem('torusToken'),function(result) {
          if (result == true) {
            var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
            $.ajax({
              url : '/login',
              data : {accessToken : token},
              type : 'GET',
              success: function(data) {
                data = JSON.parse(data);
                if(data['provider'] == true)
                  alert('Providers cannot add programs to wishlist!');
                else {
                  var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
                  $.ajax({
                    url : '/wish-listget',
                    data : {accessToken : token, programID : program_id, locationID : location_id},
                    type : 'GET',
                    success: function(data) {
                      if (data != 'False') {
                        $.ajax({
                          url : '/wish-listpost',
                          data : {accessToken : token, programID : program_id, locationID : location_id},
                          type : 'POST',
                          success : function(data) {
                            if (data == 'True') {
                              alert('Program added to wishlist!')
                              return;
                            }
                            else {
                              alert('Failed to add program to wishlist')
                              return;
                            }
                          }
                        })
                      }
                      else {
                        alert('Program already in wishlist')
                        return false;
                      }
                    }
                  })
                }
              }
            });
          }
          else {
            $('.application_login').addClass('hidden');
            $('.wishlist_login').removeClass('hidden');
            $('#loginModal').modal();
          }
        })
      }
      else {
        $('.application_login').addClass('hidden');
        $('.wishlist_login').removeClass('hidden');
        $('#loginModal').modal();
      }
    }
  },

  removeWishlist: function () {
    var self = this;
    $('#removewish').on('click', function(e) {
      var wishString = this.value;
      wishString = wishString.split('&');
      var program_id = wishString[0];
      var location_id = wishString[1];
      var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
      $.ajax({
        url : '/wish-listremove',
        data : {accessToken : token, programID : program_id, locationID : location_id},
        type : 'POST',
        success : function(data) {
          if (data == 'True') {
            self.getUserDetails();
            return;
          }
          else {
            alert('Failed to remove program from wishlist')
            return;
          }
        }
      })
    })
  },

  validToken: function(token, callback) {
    var detoken = sjcl.decrypt('hello', token);
    $.ajax({
      url : '/token',
      data : {accessToken : detoken},
      type : 'GET',
      success: function(data) {
        if(data == 'True')
          callback(true);
        else 
          callback(false);
      }
    })
  },

  completeProfile: function(appSignUp, token, callback) {
    var self = this;
    // if user just signed up through application modal
    if (appSignUp) {
      $.ajax({
        url : '/user-profile',
        data : {username : $('#profileemail').val().toLowerCase()},
        type: 'GET',
        success: function(data) {
          userdata = data.attributes;
          userdata = JSON.parse(userdata);
          var attributeNames = ['phone_number','birthdate','address','custom:city',
                              'custom:state','custom:zipcode', 'custom:school']
          for(var i = 0; i < attributeNames.length; i++) {
            if(!(attributeNames[i] in userdata)) {
              callback(false); 
              return;
            }
          }
          callback(true);
          return;
        }
      })
      callback(false);
      return;
    }
    else {
      // validate token and get details 
      self.validToken(localStorage.getItem('torusToken'),function(result) {
        // if token valid
        if(result == true) {
          var token = sjcl.decrypt('hello',localStorage.getItem('torusToken'))
          $.ajax({
            url : '/user-profile',
            data : {accessToken : token},
            type : 'GET',
            success: function(data) {
              userdata = data.attributes;
              userdata = JSON.parse(userdata);
              var attributeNames = ['phone_number','birthdate','address','custom:city',
                                  'custom:state','custom:zipcode', 'custom:school']
              for(var i = 0; i < attributeNames.length; i++) {
                if(!(attributeNames[i] in userdata)) {
                  callback(false); 
                  return;
                }
              }
              callback(true);
              return;
            }
          });
        }
        else
          callback(false);
      })
    }
  },

  appendPrograms: function(program, progloc, identifier) {
    var programURLName = program.name.replace(/ /g, '-');
    if(program.age_min == null ) 
      program.age_min = '';
    if(program.age_max == null)
      program.age_max = '';
    if(program.cost == null)
      program.cost = '';
    if(progloc == null)
      progloc = '';

    // age_min only
    if (program.age_min != '' && program.age_max == '') {
      var ageString = '<div class="col-xs-10"><strong class="small">Age:</strong><br />' +
        program.age_min + '</div>';
    }
    // both age_min and age_max
    else if (program.age_min != '' && program.age_max != '') {
      var ageString = '<div class="col-xs-10"><strong class="small">Age:</strong><br />' +
       program.age_min + ' - ' + program.age_max + '</div>';
    }
    // age_max only
    else if (program.age_min == '' && program.age_max != '') {
      var ageString = '<div class="col-xs-10"><strong class="small">Age:</strong><br />Under '
         + program.age_max +'</div>';
    }
    // None if no age range
    else {
      var ageString = '';
    };

    var programDetails = '';
    if (progloc != '' || program.cost > 0 || ageString != '' || program.program_type != '') {
      programDetails += '<div class="row mtl ptm border-top">';
      if (progloc != '') {
        programDetails += '<div class="col-xs-6 col-md-3 mbm">' + '<strong class="small">Location: </strong> </br>' + progloc.city + ', ' + progloc.state + '</div>';
      }
      if (program.cost != '') {
        programDetails += '<div class="col-xs-6 col-md-3 mbm"><strong class="small">Cost:</strong><br />' + TORUS.Utilities.truncate(program.cost, 15) + '</div>';
      }
      if (ageString != '') {
        programDetails += '<div class="col-xs-6 col-md-3 mbm">' + ageString + '</div>';
      }
      if (program.program_type != '') {

        type = program.program_type.split(',')
        if (type.length > 3)
          type = type.slice(0,3).join()
        programDetails += '<div class="col-xs-6 col-md-3 mbm"><strong class="small">Type:</strong><br />' + program.program_type + '</div>';
      }
      programDetails += '</div>';
    }

    if (program.image) {
      var img = "background-image: url('" + program.image + "')";
    } else {
      var img = "background-image: url(//s3.amazonaws.com/torusimages/searchimages/default.jpg)";
    }


    if (program.date_applied) {
      if (identifier == "#applied_results")
        var applied = '<div class="col-xs-10" style="width:100%"><strong>Applied on: </strong>' +
          program.date_applied + '</div><br />';
      else {
        var applied = '<div class="row mbs">' +
                        '<div class="col-xs-12 col-sm-6 col-md-8 ptm pbs">' +
                          '<span><strong>Added to wishlist on: </strong>' +
                            program.date_applied +
                          '</span>' +
                        '</div>' +
                        '<div class="col-xs-12 col-sm-6 col-md-4">' +
                          '<button class="float-right mobile-100" id="removewish" value="' + program.id + '&' + progloc.id + '">Remove from wishlist</button>' +
                        '</div>' +
                      '</div>';
      }
    }
    else 
      var applied = "";

    $(identifier).append(
      applied +
      '<div class="card">\
        <a href="/program/' + programURLName +'" data-category="User profile" data-action="view applied" data-label="' + program.name +'">\
          <div class="card__photo bg-purple-light" style="' + img + '">\
          </div>\
          <div class="card__content">\
              <div class="row">\
                <div class="col-xs-12">\
                  <h5>' + program.name + '</h5>\
                  <div class="small">'
                    + TORUS.Utilities.truncate(program.activities, 155) +
                  '</div>'
                    + programDetails +
                '</div>\
              </div>\
            </div>\
        </a>\
      </div>'
    );
  },

  locationMatch: function(program, locations) {
    for(var i = 0; i < locations.length; i++) {
      if(program.locations.length == 0)
        return '';
      for(var j = 0; j < program.locations.length; j++) {
        if(program.locations[j] == locations[i].id)
          return locations[i];
      }
    }
  },

  appendProvPrograms: function (program) {
    var programURLName = program.name.replace(/ /g, '-');
    $('#provider_programs').append(
      '<tr> \
        <td>'
          + program.name +
        '</td> \
        <td> \
          <a href="/program/' + programURLName + '">Preview</a> \
        </td> \
        <td> \
          <a href="/provider-program/' + program.id + '">Update</a> \
        </td> \
      </tr>'
    )
  },

  // FBlogin: function (response) {

  //   // Check if the user logged in successfully.
  //   if (response.authResponse) {

  //     console.log('You are now logged in. ');

  //     // Add the Facebook access token to the Cognito credentials login map.
  //     AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  //       IdentityPoolId: 'us-east-1:6fb57cb4-dd7d-471b-80d2-1e2faf7ae3cc',
  //       Logins: {
  //         'graph.facebook.com': response.authResponse.accessToken
  //       }
  //     });

  //     // Obtain AWS credentials
  //     AWS.config.credentials.get(function(){
  //         // Access AWS resources here.
  //     });

  //   } else {
  //     console.log('There was a problem logging you in.');
  //   }
  // },

}

TORUS.AWS.init();
