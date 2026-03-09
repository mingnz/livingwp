{% assign article_pages = site.pages | where: "article", true | sort: "title" %}

<ul>
  {% for page in article_pages %}
    <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
  {% endfor %}
</ul>
