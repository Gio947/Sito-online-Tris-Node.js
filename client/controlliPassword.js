function controllo()
{
        var password1 = document.getElementById('password').value;
        var password2 = document.getElementById('password1').value;

        if(password1 != password2)
        {
            alert("Le due password devono essere uguali.");
            return false;
        }
        
        return true;
}

function mostraPassword() {
  var psw = document.getElementById("password");
  var psw1 = document.getElementById("password1");

  if (psw.type === "password") 
  {
      psw.type = "text";
      psw1.type = "text";
  } 
  else 
  {
      psw.type = "password";
      psw1.type = "password";
  }
}