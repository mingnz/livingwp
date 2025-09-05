<ul>
  {% for page in site.pages %}
    {% if page.article == true %}
      <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>        
    {% endif %}  
  {% endfor %} 
</ul>
