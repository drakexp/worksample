from django.shortcuts import render, render_to_response
from django.views.generic import View
from django.template.loader import render_to_string
from django.http import JsonResponse, HttpResponse
from programs.models import Program, Organization, Location, Category, Subcategory, Tag, School
from django.forms.models import model_to_dict
from geopy.geocoders import GoogleV3
from cognitodata.models import Wishlist, AppliedProgram
from datetime import date
from django.template import RequestContext


import boto3, json, time

geolocator = GoogleV3()

class MainView(View):
    def get(self, request):
        template = 'main/index.html'
        return render(request, template)

class StyleGuide(View):
    def get(self, request):
        template = 'main/style-guide.html'
        return render(request, template)

class ProviderProfileView(View):
    def get(self, request):
        template = 'main/provider/profile.html'
        if request.is_ajax():
            try:
                orgName = request.GET.get('orgname')
                org = Organization.objects.get(name=orgName)
                if org.location_id != None:
                    location = Location.objects.get(id=org.location_id)
                    loc = model_to_dict(location)
                else: 
                    loc = None

                programs = Program.objects.filter(organization=org).values()
                orgupdate = org.updated_at          
                if org:
                    org = model_to_dict(org)
                    if org['phone_number']:
                        org['phone_number'] = org['phone_number'].raw_input
                else:   
                    org = None
                if programs:
                    programs = list(programs)
                else:
                    programs = None
                data = {
                    'org' : org,
                    'loc' : loc,
                    'programs' : programs,
                    'orgupdated' : orgupdate
                }
                return JsonResponse(data)
            except:
                data = {
                    'org' : None,
                    'loc' : None,
                    'programs' : None,
                    'orgupdated' : None
                }
                return JsonResponse(data)
        return render(request, template)
    def post(self, request):
        if request.is_ajax():
            try:
                orgName = request.POST.get('orgname')
                org = Organization.objects.get(name=orgName)
                attributes = request.POST.get('attributes')
                attributes = json.dumps(attributes)
                attributes = eval(json.loads(attributes))
                org.url = attributes['url']
                org.mission = attributes['mission']
                org.twitter = attributes['twitter']
                org.facebook = attributes['facebook']
                org.phone_number = attributes['phone']

                if org.location_id == None:
                    loc = geolocator.geocode(attributes['addressline1'] + ' ' + attributes['city'])
                    location = Location(address_line_1=attributes['addressline1'], address_line_2=attributes['addressline2'],
                        city=attributes['city'], state=attributes['state'], zip_code=attributes['zipcode'], latitude=loc.latitude, longitude=loc.longitude)
                    location.save()
                    org.location_id = location.id
                else:
                    loc = geolocator.geocode(attributes['addressline1'] + ' ' + attributes['city'])
                    location = Location.objects.get(id=org.location_id)
                    location.address_line_1 = attributes['addressline1']
                    location.address_line_2 = attributes['addressline2']
                    location.city = attributes['city']
                    location.state = attributes['state']
                    location.zip_code = attributes['zipcode']
                    location.latitude = loc.latitude
                    location.longitude = loc.longitude
                    location.save()
                org.save()
                email = attributes['email']
                if email:
                    accessToken = request.POST.get('accessToken')
                    client = boto3.client('cognito-idp', 'us-east-1')
                    try:
                        userattributes = [{'Name' : 'email', 'Value' : email}]
                        response = client.update_user_attributes(
                            UserAttributes = userattributes,
                            AccessToken = accessToken
                        )
                    except: 
                        HttpResponse(False)
                return HttpResponse(True)
            except:
                return HttpResponse(False)

class ProviderProgramView(View):
    def get(self, request, prog_id):
        template = 'main/provider/program.html'
        if request.is_ajax():
            accessToken = request.GET.get('accessToken')
            client = boto3.client('cognito-idp', 'us-east-1')
            try:
                response = client.get_user(AccessToken = accessToken)
                attr = response.get('UserAttributes')
                for i in range(len(attr)):
                    if attr[i].get('Name') == 'custom:provider' and attr[i].get('Value') == 'yes':
                        for i in range(len(attr)):
                            if attr[i].get('Name') == 'name':
                                orgname = attr[i].get('Value')
                                break
                        org = Organization.objects.get(name=orgname)
                        program = Program.objects.get(id=prog_id)
                        if program.organization_id == org.id:
                            return HttpResponse(True)
                        else:
                            return HttpResponse(False)
                return HttpResponse(False)
            except:
                return HttpResponse(False)
        else:
            program = Program.objects.get(id=prog_id)
            locations = program.locations.all()
            organization = Organization.objects.get(id=program.organization_id)
            if not locations:
                locations = None
            program_type = program.program_type
            if program_type:
                program_type = program_type.lower()
            categories = Category.objects.all()
            subcategories = Subcategory.objects.all()
            tags = program.tags.all().values_list('name', flat=True)
            tags = ','.join(tags)
            try:
                deadlinedate = time.strftime('%m/%d/%Y',time.strptime(str(program.deadline), '%Y-%m-%d'))
            except:
                deadlinedate = None
            context = {'program' : program, 'locations' : locations, 'program_type' : program_type, \
                'categories' : categories, 'subcategories' : subcategories, 'tags' : tags, \
                'organization' : organization, 'deadlinedate' : deadlinedate}
            return render(request, template, context)
        return render(request, template)

    def post(self, request, prog_id):
        if request.is_ajax():
            if request.POST.get('details'):
                try:
                    details = request.POST.get('details')
                    details = json.dumps(details)
                    details = eval(json.loads(details))
                    program = Program.objects.get(id=prog_id)

                    program.activities = details['activities']
                    program.eligibility = details['eligibility']
                    program.cost = details['cost']
                    program.cost_slider = details['cost_slider']
                    program.gender = details['gender']
                    program.language = details['language']
                    if details['age_min'] != '':
                        program.age_min = details['age_min']
                    if details['age_max'] != '':    
                        program.age_max = details['age_max']
                    program.meets = details['meets']
                    if details['food_provided'] == 'True':
                        program.food_provided = True
                    else:
                        program.food_provided = False
                    if details['immigrant_services'] == 'True':
                        program.immigrant_services = True
                    else:
                        program.immigrant_services = False
                    if details['juvenile_justice'] == 'True':
                        program.juvenile_justice = True
                    else:
                        program.juvenile_justice = False
                    if details['homeless_in_crisis'] == 'True':
                        program.homeless_in_crisis = True
                    else:
                        program.homeless_in_crisis = False
                    if details['foster_care'] == 'True':
                        program.foster_care = True
                    else:
                        program.foster_care = False
                    if details['lgbtq'] == 'True':
                        program.lgbtq = True
                    else:
                        program.lgbtq = False
                    if details['physical_disability'] == 'True':
                        program.physical_disability = True
                    else:
                        program.physical_disability = False
                    if details['substance_abuse'] == 'True':
                        program.substance_abuse = True
                    else:
                        program.substance_abuse = False
                    if details['mental_health'] == 'True':
                        program.mental_health = True
                    else:
                        program.mental_health = False
                    if details['in_school'] == 'True':
                        program.in_school = True
                    else:
                        program.in_school = False

                    program.program_type = details['program_type']
                    tagStrings = details['tags'].split(',')
                    tagStrings = [p.strip() for p in tagStrings]
                    tagStrings = list(filter(None, tagStrings))
                    for string in tagStrings:
                        try:
                            tag = Tag.objects.get(name=string)
                        except:
                            newtag = Tag(name=string)
                            newtag.save()
                    alltags = Tag.objects.filter(name__in=tagStrings)
                    program.tags = alltags

                    if details['categories']:
                        allcategories = Category.objects.filter(name__in=details['categories']).distinct('name')
                        program.category = allcategories
                    if details['subcategories']:
                        subcategories = []
                        for s in details['subcategories']:
                            if 'other' in s:
                                cat = s.split('+')[0]
                                catid = Category.objects.get(name=cat).id
                                subcat = Subcategory.objects.get(name='other',object_id = catid)
                                subcategories.append(subcat)
                            else:
                                subcat = Subcategory.objects.get(name=s)
                                subcategories.append(subcat)
                        subcatIds = []
                        for s in subcategories:
                            subcatIds.append(s.id)
                        allsubcats = Subcategory.objects.filter(id__in=subcatIds)
                        program.subcategories = allsubcats
                    program.save()
                    org = Organization.objects.get(program=program)
                    org.save()
                    return HttpResponse(program.name)
                except:
                    return HttpResponse(False)
            elif request.POST.get('contacts'):
                try:
                    contacts = request.POST.get('contacts')
                    contacts = json.dumps(contacts)
                    contacts = eval(json.loads(contacts))
                    program = Program.objects.get(id=prog_id)
                    program.phone_number = contacts['phone_number']
                    program.email = contacts['email']
                    program.save()
                    org = Organization.objects.get(program=program)
                    org.save()
                    return HttpResponse(program.name)
                except:
                    return HttpResponse(False)
            elif request.POST.get('application'):
                try: 
                    application = request.POST.get('application')
                    application = json.dumps(application)
                    application = eval(json.loads(application))
                    program = Program.objects.get(id=prog_id)
                    program.application_instructions = application['application_instructions']
                    program.how_to_apply = application['how_to_apply']
                    program.application_link = application['application_link']
                    if application['deadline'] == 'Rolling' or application['deadline'] == 'Drop In':
                        print(1)
                        program.deadline_type = application['deadline']
                    else:
                        program.deadline_type = 'Calendar'
                        deadline = time.strftime('%Y-%m-%d',time.strptime(application['deadline'], '%m/%d/%Y'))
                        program.deadline = deadline
                    program.save()
                    org = Organization.objects.get(program=program)
                    org.save()
                    return HttpResponse(program.name)
                except:
                    return HttpResponse(False)
            elif request.POST.get('imagelink'):
                try: 
                    imagelink = request.POST.get('imagelink')
                    program = Program.objects.get(id=prog_id)
                    imagelink = imagelink.replace(' ', '+')
                    program.image = imagelink
                    program.save()
                    org = Organization.objects.get(program=program)
                    org.save()
                    return HttpResponse(program.name)
                except:
                    return HttpResponse(False)
            elif request.POST.get('locationupdate'):
                try:
                    attributes = request.POST.get('locationupdate')
                    attributes = json.dumps(attributes)
                    attributes = eval(json.loads(attributes))
                    program = Program.objects.get(id=prog_id)
                    attributes['addressLine1'] = attributes['addressLine1'].replace('+', ' ')
                    attributes['addressLine2'] = attributes['addressLine2'].replace('+', ' ')
                    attributes['city'] = attributes['city'].replace('+', ' ')
                    loc = geolocator.geocode(attributes['addressLine1'] + ' ' + attributes['city'])
                    if not loc:
                        loc = geolocator.geocode(attributes['addressLine1'] + ' ' + attributes['zipcode'])
                    location = Location.objects.get(id=attributes['locationId'])
                    location.address_line_1 = attributes['addressLine1']
                    location.address_line_2 = attributes['addressLine2']
                    location.city = attributes['city']
                    location.state = attributes['state']
                    location.zip_code = attributes['zipcode']
                    location.latitude = loc.latitude
                    location.longitude = loc.longitude
                    location.save()
                    org = Organization.objects.get(program=program)
                    org.save()
                    return HttpResponse(True)
                except:
                    return HttpResponse(False)
            elif request.POST.get('locationadd'):
                try:
                    attributes = request.POST.get('locationadd')
                    attributes = json.dumps(attributes)
                    attributes = eval(json.loads(attributes))
                    attributes['addressLine1'] = attributes['addressLine1'].replace('+', ' ')
                    attributes['addressLine2'] = attributes['addressLine2'].replace('+', ' ')
                    attributes['city'] = attributes['city'].replace('+', ' ')
                    program = Program.objects.get(id=prog_id)
                    loc = geolocator.geocode(attributes['addressLine1'] + ' ' + attributes['city'])
                    newLocation = Location(address_line_1=attributes['addressLine1'], \
                        address_line_2=attributes['addressLine2'], city=attributes['city'], \
                        state=attributes['state'], zip_code=attributes['zipcode'], \
                        latitude=loc.latitude, longitude=loc.longitude)
                    newLocation.save()
                    program.locations.add(newLocation)
                    program.save()
                    org = Organization.objects.get(program=program)
                    org.save()
                    return HttpResponse(True)
                except:
                    return HttpResponse(False)

            elif request.POST.get('removelocation'):
                try:
                    loc = request.POST.get('removelocation')
                    location = Location.objects.get(id=loc)
                    program = Program.objects.get(id=prog_id)
                    program.locations.remove(location)
                    program.save()
                    location.delete()
                    org = Organization.objects.get(program=program)
                    org.save()
                    return HttpResponse(True)
                except:
                    return HttpResponse(False)
            else:
                return HttpResponse(False)
                

class AboutView(View):
    def get(self, request):
        template = 'main/about.html'
        return render(request, template)

class PrivacyView(View):
    def get(self, request):
        template = 'main/privacy.html'
        return render(request, template)

class CostCalculatorView(View):
    def get(self, request):
        template = 'main/cost-calculator.html'
        return render(request, template)

class LoginView(View):
    def get(self, request):
        template = 'main/login.html'
        if request.is_ajax():
            accessToken = request.GET.get('accessToken')
            client = boto3.client('cognito-idp', 'us-east-1')
            data = {}
            data['provider'] = False
            try:
                response = client.get_user(AccessToken = accessToken)
                attr = response.get('UserAttributes')
                data['username'] = response.get('Username')
                for i in range(len(attr)):
                    if attr[i].get('Name') == 'custom:provider' and attr[i].get('Value') == 'yes':
                        data['provider'] = True
                return HttpResponse(json.dumps(data))  
            except:
                return HttpResponse(json.dumps(data))
        return render(request, template)
    def post(self, request):
        if request.is_ajax():
            accessToken = request.GET.get('accessToken')
            client = boto3.client('cognito-idp', 'us-east-1')
            try:
                response = client.global_sign_out(AccessToken = accessToken)
                return HttpResponse(True)
            except: 
                return HttpResponse(False)

class SignupView(View):
    def get(self, request):
        template = 'main/signup.html'
        return render(request, template)
    def post(self, request):
        if request.is_ajax():
            try:
                client = boto3.client('cognito-idp', 'us-east-1')
                attributes = request.POST.get('attributes')
                attributes = json.dumps(attributes)
                attributes = eval(json.loads(attributes))
                try:
                    userattributes = [
                            {'Name' : 'email', 'Value' : attributes['email']},
                            {'Name' : 'name', 'Value' : attributes['fullname']},
                            {'Name' : 'birthdate', 'Value' : attributes['birthdate']},
                            {'Name' : 'custom:user_type', 'Value' : attributes['custom:user_type']}
                        ]
                    response = client.sign_up(
                        ClientId='4r4jglheombjc8pq6dveggapfc',
                        Username=attributes['email'],
                        Password=attributes['password'],
                        UserAttributes= userattributes
                    )
                except Exception as e:
                    return HttpResponse(e.response['Error']['Code'])
                return HttpResponse(True)
            except:
                return HttpResponse(False)
        return HttpResponse(False)        

class UserProfileView(View):
    def get(self, request):
        template = 'main/user/profile.html'
        if request.is_ajax():
            if request.GET.get('accessToken'):
                accessToken = request.GET.get('accessToken')
                client = boto3.client('cognito-idp', 'us-east-1')
                try:
                    response = client.get_user(AccessToken = accessToken)
                    attr = response.get('UserAttributes')
                    attributes = {}
                    for i in range(len(attr)):
                        attributes[attr[i].get('Name')] = attr[i].get('Value')
                    schools = School.objects.all().order_by('name').values()
                    data = {
                        'attributes' : json.dumps(attributes),
                        'schools' : list(schools)
                    }
                    return JsonResponse(data)
                except:
                    return render(request, template)
            if request.GET.get('username'):
                username = request.GET.get('username')
                try:
                    client = boto3.client(
                        'cognito-idp',
                        'us-east-1',
                        # Hard coded strings as credentials, not recommended.
                        aws_access_key_id='AKIAJYOOKUJI6UEPX7NA',
                        aws_secret_access_key='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'
                    )
                    response = client.admin_get_user(
                    UserPoolId='us-east-1_6xTaZ0XVe',
                    Username=username
                    )
                    attr = response.get('UserAttributes')
                    attributes = {}
                    for i in range(len(attr)):
                        attributes[attr[i].get('Name')] = attr[i].get('Value')
                    schools = School.objects.all().order_by('name').values()
                    data = {
                        'attributes' : json.dumps(attributes),
                        'schools' : list(schools)
                    }
                    return JsonResponse(data)
                except:
                    return render(request, template)
        return render(request, template)
        
    def post(self, request):
        if request.is_ajax():
            if request.POST.get('attributes'):
                accessToken = request.POST.get('accessToken')
                client = boto3.client('cognito-idp', 'us-east-1')
                attributes = request.POST.get('attributes')
                attributes = json.dumps(attributes)
                attributes = eval(json.loads(attributes))
                try:
                    userattributes = [
                            {'Name' : 'email', 'Value' : attributes['email']},
                            {'Name' : 'name', 'Value' : attributes['fullname']},
                            {'Name' : 'birthdate', 'Value' : attributes['birthdate']},
                            {'Name' : 'phone_number', 'Value' : attributes['phone_number']},
                            {'Name' : 'address', 'Value' : attributes['address']},
                            {'Name' : 'custom:city', 'Value' : attributes['custom:city']},
                            {'Name' : 'custom:state', 'Value' : attributes['custom:state']},
                            {'Name' : 'custom:zipcode', 'Value' : attributes['custom:zipcode']},
                            {'Name' : 'custom:user_goals', 'Value' : attributes['custom:user_goals']},
                            {'Name' : 'custom:lunch', 'Value' : attributes['custom:lunch']},
                            {'Name' : 'custom:gender', 'Value' : attributes['custom:gender']},
                            {'Name' : 'custom:race', 'Value' : attributes['custom:race']},
                            {'Name' : 'custom:school', 'Value' : attributes['custom:school']},
                            {'Name' : 'custom:text', 'Value' : attributes['custom:text']}
                        ]
                    response = client.update_user_attributes(
                        UserAttributes = userattributes,
                        AccessToken = accessToken
                    )
                except:
                    return HttpResponse(False)
            if request.POST.get('appAttributes'):
                attributes = request.POST.get('appAttributes')
                attributes = json.dumps(attributes)
                attributes = eval(json.loads(attributes))
                try:
                    userattributes = [
                        {'Name' : 'email', 'Value' : attributes['email']},
                        {'Name' : 'name', 'Value' : attributes['fullname']},
                        {'Name' : 'birthdate', 'Value' : attributes['birthdate']},
                        {'Name' : 'phone_number', 'Value' : attributes['phone_number']},
                        {'Name' : 'address', 'Value' : attributes['address']},
                        {'Name' : 'custom:city', 'Value' : attributes['custom:city']},
                        {'Name' : 'custom:state', 'Value' : attributes['custom:state']},
                        {'Name' : 'custom:zipcode', 'Value' : attributes['custom:zipcode']},
                        {'Name' : 'custom:user_goals', 'Value' : attributes['custom:user_goals']},
                        {'Name' : 'custom:lunch', 'Value' : attributes['custom:lunch']},
                        {'Name' : 'custom:gender', 'Value' : attributes['custom:gender']},
                        {'Name' : 'custom:race', 'Value' : attributes['custom:race']},
                        {'Name' : 'custom:school', 'Value' : attributes['custom:school']},
                        {'Name' : 'custom:text', 'Value' : attributes['custom:text']}
                    ]
                    client = boto3.client(
                        'cognito-idp',
                        'us-east-1',
                        # Hard coded strings as credentials, not recommended.
                        aws_access_key_id='AKIAJYOOKUJI6UEPX7NA',
                        aws_secret_access_key='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'
                    )
                    response = client.admin_update_user_attributes(
                        UserPoolId='us-east-1_6xTaZ0XVe',
                        Username=attributes['email'],
                        UserAttributes=userattributes
                    )
                except:
                    return HttpResponse(False)

            if request.POST.get('application'):
                try:
                    if request.POST.get('accessToken'):
                        accessToken = request.POST.get('accessToken')
                        client = boto3.client('cognito-idp', 'us-east-1')
                        response = client.get_user(AccessToken = accessToken)
                    elif request.POST.get('username'):
                        user = request.POST.get('username')
                        client = boto3.client(
                            'cognito-idp',
                            'us-east-1',
                            # Hard coded strings as credentials, not recommended.
                            aws_access_key_id='AKIAJYOOKUJI6UEPX7NA',
                            aws_secret_access_key='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'
                        )
                        response = client.admin_get_user(
                            UserPoolId='us-east-1_6xTaZ0XVe',
                            Username=user
                        )
                    attr = response.get('UserAttributes')
                    for i in range(len(attr)):
                        if(attr[i].get('Name') == 'email'):
                            email = attr[i].get('Value')
                    applicationInfo = request.POST.get('application')
                    applicationInfo = json.dumps(applicationInfo)
                    applicationInfo = eval(json.loads(applicationInfo))
                    otherProgram1 = None
                    otherProgram2 = None
                    if applicationInfo['otherProg1']:
                        try:
                            otherProgram1 = Program.objects.get(name=applicationInfo['otherProg1'])
                        except:
                            pass
                    if applicationInfo['otherProg2']:
                        try:
                            otherProgram2 = Program.objects.get(name=applicationInfo['otherProg2'])                
                        except:
                            pass
                    program = None
                    location = None
                    if applicationInfo['programID']:
                        try:
                            program = Program.objects.get(pk=applicationInfo['programID'])
                        except:
                            return HttpResponse(False)
                    if applicationInfo['locationID']:
                        try:
                            location = Location.objects.get(pk=applicationInfo['locationID'])
                        except:
                            return HttpResponse(False)
                    try:
                        application = AppliedProgram.objects.get(user_email=email,program=program)
                        application.reason_for_applying = applicationInfo['reason']
                        application.program_other_1 = otherProgram1
                        application.program_other_2 = otherProgram2
                        application.location = location
                        application.save()
                    except:
                        try:
                            application = AppliedProgram(user_email=email,program=program,location=location, \
                                reason_for_applying=applicationInfo['reason'],program_other_1=otherProgram1,program_other_2=otherProgram2)
                            application.save()
                        except:
                            return HttpResponse(False)
                    return HttpResponse(True)
                except:
                    return HttpResponse(False)
            else: 
                return HttpResponse(True)
        return HttpResponse(False)

class TermsView(View):
    def get(self, request):
        template = 'main/terms.html'
        return render(request, template)

class ConfirmationView(View):
    def get(self, request):
        template = 'main/confirmation.html'
        return render(request, template)
    def post(self, request):
        if request.is_ajax():
            try:
                client = boto3.client('cognito-idp', 'us-east-1')
                user = request.POST.get('user')
                key = request.POST.get('verifykey')
                response = client.confirm_sign_up(
                  ClientId='4r4jglheombjc8pq6dveggapfc',
                  Username=user,
                  ConfirmationCode=key,
                )
                return HttpResponse(True)
            except Exception as e:
                return HttpResponse(e.response['Error']['Code'])
        return HttpResponse(False)


class NewVerificationView(View):
    def get(self, request):
        template = 'main/newverification.html'
        return render(request, template)
    def post(self, request):
        if request.is_ajax():
            try:
                client = boto3.client('cognito-idp', 'us-east-1')
                user = request.POST.get('user')
                response = client.resend_confirmation_code(
                    ClientId='4r4jglheombjc8pq6dveggapfc',
                    Username=user
                )
                return HttpResponse(True)
            except Exception as e:
                return HttpResponse(e.response['Error']['Code'])
        return HttpResponse(False)

class ForgotPasswordView(View):
    def get(self, request):
        template = 'main/forgotpassword.html'
        return render(request, template)
    def post(self, request):
        if request.is_ajax():
            client = boto3.client('cognito-idp', 'us-east-1')
            if request.POST.get('verifykey'):
                try:
                    user = request.POST.get('user')
                    key = request.POST.get('verifykey')
                    password = request.POST.get('password')
                    response = client.confirm_forgot_password(
                        ClientId='4r4jglheombjc8pq6dveggapfc',
                        Username=user,
                        ConfirmationCode=key,
                        Password=password
                    )
                    return HttpResponse(True)
                except Exception as e:
                    return HttpResponse(e.response['Error']['Code'])
            else:
                try:
                    user = request.POST.get('user')
                    response = client.forgot_password(
                        ClientId='4r4jglheombjc8pq6dveggapfc',
                        Username=user
                    )
                    return HttpResponse(True)
                except Exception as e:
                    print(e)
                    return HttpResponse(e.response['Error']['Code'])
        return HttpResponse(False)

def WishlistGet(request):
    if request.is_ajax():
        if request.GET.get('accessToken'):
            try:
                accessToken = request.GET.get('accessToken')
                client = boto3.client('cognito-idp', 'us-east-1')
                response = client.get_user(AccessToken = accessToken)
                attr = response.get('UserAttributes')
                for i in range(len(attr)):
                    if(attr[i].get('Name') == 'email'):
                        email = attr[i].get('Value')
            except:
                HttpResponse(False)
        elif request.GET.get('username'):
            email = request.GET.get('username')
        if request.GET.get('programID'):
            programID = request.GET.get('programID')
            locationID = request.GET.get('locationID')
            wishlistPrograms = Wishlist.objects.filter(user_email=email)
            if wishlistPrograms:
                for program in wishlistPrograms:
                    if int(programID) == program.program_id and int(locationID) == program.location_id:
                        return HttpResponse(False)
            return HttpResponse(True)
        else:    
            try:
                try:
                    wishlist_programsID = Wishlist.objects.filter(user_email=email).values_list('program_id', flat=True)
                    wishlist_locationsID = Wishlist.objects.filter(user_email=email).values_list('location_id', flat=True)
                except:
                    wishlist_programsID = []
                    pass
                if wishlist_programsID != []:
                    wishlist_programs = Program.objects.filter(pk__in=wishlist_programsID).values()
                else:
                    wishlist_programs = []
                if wishlist_programs != []:
                    for p in wishlist_programs:
                        p['locations'] = Program.objects.filter(pk=p['id']).values_list('locations',flat=True)
                        p['locations'] = [x for x in p['locations'] if x is not None]
                        if Wishlist.objects.get(user_email=email,program_id=p['id']):
                            p['date_applied'] = Wishlist.objects.get(user_email=email,program_id=p['id']).date_applied
                    wishlist_locations = Location.objects.filter(pk__in=wishlist_locationsID).values()
                else:
                    wishlist_locations = []
                try: 
                    applied_programsID = AppliedProgram.objects.filter(user_email=email).values_list('program_id', flat=True)
                    applied_locationsID = AppliedProgram.objects.filter(user_email=email).values_list('location_id', flat=True)
                except:
                    applied_programsID = []
                    pass
                if applied_programsID != []:
                    applied_programs = Program.objects.filter(pk__in=applied_programsID).values()
                else:
                    applied_programs = []
                if applied_programs != []:
                    for p in applied_programs:
                        p['locations'] = Program.objects.filter(pk=p['id']).values_list('locations',flat=True)
                        p['locations'] = [x for x in p['locations'] if x is not None]
                        if AppliedProgram.objects.get(user_email=email,program_id=p['id']):
                            p['date_applied'] = AppliedProgram.objects.get(user_email=email,program_id=p['id']).date_applied
                    applied_locations = Location.objects.filter(pk__in=applied_locationsID).values()
                else:
                    applied_locations = []
                data = {
                'wishlistPrograms' : list(wishlist_programs),
                'wishlistLocations' : list(wishlist_locations),
                'appliedPrograms' : list(applied_programs),
                'appliedLocations' : list(applied_locations)
                }
                return JsonResponse(data)
            except:
                return HttpResponse(False)
    return HttpResponse(False) 
    
def WishlistPost(request):
    if request.is_ajax():
        if request.POST.get('accessToken'):
            try:
                accessToken = request.POST.get('accessToken')
                client = boto3.client('cognito-idp', 'us-east-1')
                response = client.get_user(AccessToken = accessToken)
                attr = response.get('UserAttributes')
                for i in range(len(attr)):
                    if attr[i].get('Name') == 'email':
                        email = attr[i].get('Value');
            except:
                return HttpResponse(False)
        elif request.POST.get('username'):
            email = request.POST.get('username')
        try:
            locationID = request.POST.get('locationID')
            programID = request.POST.get('programID')
            if locationID:
                location = Location.objects.get(id=locationID)
            if programID:
                program = Program.objects.get(id=programID)
            wishlist = Wishlist(user_email=email,program=program,location=location)
            wishlist.save()
            return HttpResponse(True)
        except:
            return HttpResponse(False)

def WishlistRemove(request):
    if request.is_ajax():
        try:
            accessToken = request.POST.get('accessToken')
            client = boto3.client('cognito-idp', 'us-east-1')
            response = client.get_user(AccessToken = accessToken)
            attr = response.get('UserAttributes')
            for i in range(len(attr)):
                if attr[i].get('Name') == 'email':
                    email = attr[i].get('Value');
            locationID = request.POST.get('locationID')
            programID = request.POST.get('programID')
            if locationID:
                location = Location.objects.get(id=locationID)
            if programID:
                program = Program.objects.get(id=programID)
            wishlist = Wishlist.objects.get(user_email=email,program=program,location=location)
            wishlist.delete()
            return HttpResponse(True)
        except:
            return HttpResponse(False)

def ValidateToken(request):
    if request.is_ajax():
        accessToken = request.GET.get('accessToken')
        client = boto3.client('cognito-idp', 'us-east-1')
        try:
            response = client.get_user(AccessToken = accessToken)
            return HttpResponse(True)
        except:
            return HttpResponse(False)
    return HttpResponse(False)

def AutoConfirm(request): 
    if request.is_ajax():
        user = request.POST.get('user')
        try: 
            client = boto3.client(
                'cognito-idp',
                'us-east-1',
                # Hard coded strings as credentials, not recommended.
                aws_access_key_id='AKIAJYOOKUJI6UEPX7NA',
                aws_secret_access_key='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'
            )
            response = client.admin_confirm_sign_up(
                UserPoolId='us-east-1_6xTaZ0XVe',
                Username=user
            )
            response = client.admin_update_user_attributes(
                UserPoolId='us-east-1_6xTaZ0XVe',
                Username=user,
                UserAttributes=[
                    {
                        'Name': 'email_verified',
                        'Value': 'true'
                    },
                ]
            )
            return HttpResponse(True)
        except:
            return HttpResponse(False)
    return HttpResponse(False)

def AuthenticateUser(request):
    if request.is_ajax():
        try:
            user = request.GET.get('user')
            password = request.GET.get('password')
            client = boto3.client(
                'cognito-idp',
                'us-east-1',
                # Hard coded strings as credentials, not recommended.
                aws_access_key_id='AKIAJYOOKUJI6UEPX7NA',
                aws_secret_access_key='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'
            )
            response = client.admin_initiate_auth(
                AuthFlow='ADMIN_NO_SRP_AUTH',
                UserPoolId='us-east-1_6xTaZ0XVe',
                ClientId='4r4jglheombjc8pq6dveggapfc',
                AuthParameters={
                    'USERNAME': user,
                    'PASSWORD' : password
                },
            )
            data = {
                        'response' : True,
                        'code' : response['AuthenticationResult']['AccessToken']
                    }
            return JsonResponse(data)
        except Exception as e:
            data = {
                        'response' : False,
                        'code' : e.response['Error']['Code']
                    }
            return JsonResponse(data)
    return HttpResponse(False)

def UploadImage(request):
    if request.is_ajax():
        image = request.FILES.get('image')
        providername = request.POST.get('providername')
        try:
            client = boto3.client(
                's3',                 
                aws_access_key_id='AKIAJYOOKUJI6UEPX7NA',
                aws_secret_access_key='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'
            )
            response = client.put_object(
                ACL='public-read',
                Body=image,
                Bucket='torusimages',
                Key='searchimages/' +  providername + '.jpg',
                ServerSideEncryption='AES256'
            )
            return JsonResponse(response)
        except:
            return HttpResponse(False)
    return HttpResponse(False)


def page_not_found(request):
    response = render_to_response('main/404.html', {},
        context_instance=RequestContext(request))
    response.status_code = 404
    return response
