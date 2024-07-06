# InstaLogin

https://justinstople.com/?code=AQDT9NZP5vnwfotY1Y-pYmaAP34GMZ1LRYdtNks2lf0chAb70z8sr8xskTiAerCDdhSU7Y9b4UbUmiOcKvNoV11thr5JGsz3oBYafPH0ZUh66FFexRnaK5cm_m93xftBJ993arOTr0FpGDuKQrZ5z7Z6lh-d48utA047n6pmcYX2N4emkbjNBrf0hzQsEHNfeP7RLfTYdMTl2NH-gu0hqwibb1jcF5FORCdkviLrMFHI7g#_












https://www.instagram.com/accounts/login/?force_authentication&platform_app_id=1449305852368766&enable_fb_login&next=https%3A%2F%2Fwww.instagram.com%2Foauth%2Fauthorize%2Fthird_party%2F%3Fclient_id%3D1449305852368766%26redirect_uri%3Dhttp%253A%252F%252Flocalhost%253A5000%252Fauth%252Finstagram%252Fcallback%26scope%3Duser_profile%252Cuser_media%26response_type%3Dcode%26logger_id%3D637e4933-4f0e-4564-85cd-605d4b564e28 



https://api.instagram.com/oauth/authorize?app_id=1449305852368766&redirect_uri=http://localhost:5000/auth/instagram/callback&scope=user_profile,user_media&response_type=code




https://justinstople.com/?code=AQDPqoOS006HfwiJmI--TMfWm41_bQYltQKC_vmtIDXAQM1P_j5Gji0oe-F-MU-HnifM9Y_754zp6z2TDqncjodJQ3bxa1I66pF95zlWZtovVEEkB2R1SBYz_UZjFinTaf9V6nxVqtLczD_rSx2PSo3f8NUwpjMQ1flIg2rPPBmk9DJ2Uj2EVDbfFNtfkD44QbQW8LQU9opA0yvuhIk_0y-UGi5WOjMCYZi7cRBJ61A46w#_




curl -X POST \
  https://api.instagram.com/oauth/access_token \
  -F client_id=1449305852368766 \
  -F client_secret=9359f8fd9bc149c363cc09abdde23f5d \
  -F grant_type=authorization_code \
  -F redirect_uri=https://justinstople.com/ \
  -F code=AQDPqoOS006HfwiJmI--TMfWm41_bQYltQKC_vmtIDXAQM1P_j5Gji0oe-F-MU-HnifM9Y_754zp6z2TDqncjodJQ3bxa1I66pF95zlWZtovVEEkB2R1SBYz_UZjFinTaf9V6nxVqtLczD_rSx2PSo3f8NUwpjMQ1flIg2rPPBmk9DJ2Uj2EVDbfFNtfkD44QbQW8LQU9opA0yvuhIk_0y-UGi5WOjMCYZi7cRBJ61A46w




  Acces token 


  {"access_token": "IGQWRNVXd3Rm9UN2RrTEVjUV9ndlNtdmUxZAmdBSEFscHZAkSnRpMHFSdEZAUU2VzdWx6b0JwNU83bGZAUOE9yVW0yV2lTOERzSHJnemIwMWRULWhYaWFTWWdTbkQ3bHQteTBWTUlWUlM3R0FZAbzcwRThIRUczQ0ZA1V2ZAfLTVOM1RKRGJuZAwZDZD", "user_id": 8105201049502982, "permissions": ["instagram_graph_user_profile", "instagram_graph_user_media"]}


  https://graph.instagram.com/me?fields=id,username&access_token=IGQWRNVXd3Rm9UN2RrTEVjUV9ndlNtdmUxZAmdBSEFscHZAkSnRpMHFSdEZAUU2VzdWx6b0JwNU83bGZAUOE9yVW0yV2lTOERzSHJnemIwMWRULWhYaWFTWWdTbkQ3bHQteTBWTUlWUlM3R0FZAbzcwRThIRUczQ0ZA1V2ZAfLTVOM1RKRGJuZAwZDZD
