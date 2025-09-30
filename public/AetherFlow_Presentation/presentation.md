hey claude, I want to add a presentation to my website.

  before you delete, make sure to read the bmw.html, we want to make use of a ribbon (2nd layer navbar)

  in @pages\presentation\ scrap the BMW presentation, we are rather going to build a technical presentation showing a program I am building for   
  a construction company.

  so. we want to make use of a 2nd layer navbar under presentation (a ribbon)
  with several aspects.

  we will get into the technical aspect later, but the gist of it:
  The presentation will be for Epi-Use (as a consultant, so I want to showcase many aspects, see the following)
  I am a solo developer
  I built a Diary for a Tool Hire Company (coastal hire)
  handles customer interactions (new hires, off hires, qoutes, applications, etc...)
  tracks tasks based on customer interactions
  2 task management systems: Drivers and User Tasks
  Drivers: hires, off hires, breakdowns/swaps (user agnostic) (Driver Task Assignment Dashboard)
  User Tasks: price list, quote, account statement, refund, applications, misc task (user specific) (KANBAN)
  built on PostgreSQL database (connects through SPs, no direct connections), python+FLASK business data layer (does all the validation, data     
  manipulation, api, database connections, etc...), Nextjs/React front end (only talks to FLASK API, no data manipulation)

  so...
  I want a seperate page (from ribbon) for each facet of my project, and since this is for consultancy, I want to include the business aspect     
  that I did)

  Introduction:
  so I worked at coastal hire (centurion branch) for 2 years (parents company)
  learned the ins and outs of the business, very reliant on paper, found many aspects of the business that could be improved.
  I build redementary inventory and CRM (Reps going to customers and recording interactions) systems.
  redementary, decided to study Bachelors of Computing at Belgium Campus.
  I am currently 3rd year, applying for grad programs for next year.

  Business (research, requirements analysis, system of works, etc...)
  As I worked on more projects at university, as well as working on various systems for coastal hire, learning, failing, etc...
  November 2024 I decided to begin work on a consolidated system where I will begin to build a full system for diary, inventory and CRM (later    
  debtors as well)
  so talking to my parents, and from my experience there, I started work on the diary, looking at existing diary systems and MS access templates  
   made by others.
  I built a improvised system working top down (so UI first), was developed really quickly but many shortcomings (but this was intentional, gave  
   me a taste of what was to come, allowed me to identify the platforms to use, where to put what, the layers, etc...)
  in february 2025 I wrote up a systems requirements analysis for the diary (we can go more in depth on this when we work on this page)
  I tried to design it in a way that it can be added to or edited easily.


  Database:
  From here, started work on the database, sometimes asking my friend (Sebastian Tridente, Epi-Use Labs Database Engineer) for help or tips and   
  tricks on the database.
  Built the database on a docker instance of PostgreSQL and using, again docker, PGAdmin DBMS
  the database is in rapid development, with the entire database sitting in several sql files, when I compose, it wipes the database then builds  
   it again with a bit of sample data (so I can rapidly develop it and keep everything consolodated in build files)
  all interactions with the database use SPs, on a connect per request design with the python layer (avoids concurrency issues, I still need to   
  develop rollback and other safety features)

  Business Data Layer:
  Flask + python layer, performs the data validation (i dont really like this, I would prefer the database to do this and avoid hardcoding, but   
  I will implement this in the future)
  works on connect per request, so when a user fills in an interaction, the entire interaction is built in memory and only sent to the database   
  on completion (so using CPR not dirty records or other methods)

  Front End:
  Nextjs server
  allows all machines on the local network to use the webui (meaning I dont need to install software on every machine)
  it being a tool hire company, dirty work environment, there is high computer turnover (I have 2 cold spares at home that are ready to be        
  swapped in if need be, but there is large setup on account of me needing to install the software they currently use. everything being server    
  bound makes this 100x easier for me and any other user)


  Features:
  - User Authentication and auditing:
  Users log in, and their interactions are tracked, so I track who makes new interactions, edits existing ones, etc...
  this will allow me to report on employee performance, mistakes, etc... (like users have to send whatsapps when a hire goes out for delivery...  
   I can now track if they clicked the button saying they sent the whatsapp)

  - Advanced Reporting:
  I can now report on employee performance, track mistakes, and more.
  Customer Reporting
  Tool Reporting (I can easily build dashboards to see what tools break often, which will later be used with a new invenotory system, that I      
  want to develop, with machine learning to predict machine breakdowns (they currently send 2 tools (backup/spare) on high risk tools, resulting  
   in massive losses)
  and more.

  ***
  Think Hard
  each section should be its own page on the ribbon.
  use the currently existing pages, see index.html, make sure to use the correct light/dark mode, the toggle is on the navbar.
  This is also for presentation purposes, so I want to be able to insert images, like the ERD diagram, the user interfaces, dashboards for        
  reporting, etc...
  you can keep it somewhat basic for now, later we will add animations and scrolling effects.