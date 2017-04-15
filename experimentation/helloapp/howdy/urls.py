from django.conf.urls import url
import views

urlpatterns = [
    url(r'^$', views.HomePageView.as_view()),
]