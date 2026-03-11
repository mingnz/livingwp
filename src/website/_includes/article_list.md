{% assign article_pages = site.pages | where: "article", true | where_exp: "item", "item.article_kind != 'snapshot'" | sort: "title" %}

<div class="article-cards">
  {% for pg in article_pages %}
    <a class="article-card" href="{{ pg.url | relative_url }}">
      <span class="article-card__title">{{ pg.title }}</span>
      {% if pg.article_updated_at %}
        <span class="article-card__meta">
          Updated <time datetime="{{ pg.article_updated_at }}">{{ pg.article_updated_at | date: "%-d %B %Y" }}</time>
        </span>
      {% endif %}
    </a>
  {% endfor %}
</div>
