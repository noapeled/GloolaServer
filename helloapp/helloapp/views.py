from django.http import HttpResponse
from models import *


def testview(request):
    article = Article(title='test title',
                      content='test content')
    article.save()

    return HttpResponse("<h1>Saved!</h1>")
