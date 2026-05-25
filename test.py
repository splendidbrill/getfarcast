import subprocess
r = subprocess.run(['curl','-s','-X','POST','https://www.getfarcast.com/api/background/hermes-daily','-H','Authorization: Bearer jaishreeram'],capture_output=True,text=True)
print(r.stdout)
