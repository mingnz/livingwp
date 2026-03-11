{% assign latest_articles = site.pages | where: "article", true %}
{% assign snapshot_pages = latest_articles | where: "article_kind", "snapshot" | sort: "article_updated_at" | reverse %}
{% assign snapshot_page = snapshot_pages | first %}

{% if snapshot_page %}
  <section class="snapshot-feature">
    {% if include.heading %}
      <p class="snapshot-feature__eyebrow">{{ include.heading }}</p>
    {% endif %}

    <h2 class="snapshot-feature__title">
      <a href="{{ snapshot_page.url | relative_url }}">{{ snapshot_page.title }}</a>
    </h2>

    {% if snapshot_page.article_updated_at %}
      <p class="snapshot-feature__meta">
        Updated
        <time datetime="{{ snapshot_page.article_updated_at }}">
          {{ snapshot_page.article_updated_at | date: "%-d %B %Y" }}
        </time>
      </p>
    {% endif %}

    {% if snapshot_page.article_summary %}
      <p class="snapshot-feature__summary">{{ snapshot_page.article_summary }}</p>
    {% elsif snapshot_page.description %}
      <p class="snapshot-feature__summary">{{ snapshot_page.description }}</p>
    {% endif %}

    <div class="snapshot-feature__links">
      <a class="snapshot-feature__link" href="{{ snapshot_page.url | relative_url }}">
        {{ include.primary_label | default: "Read the full snapshot" }}
      </a>

      {% if include.show_industry_link %}
        <a class="snapshot-feature__link snapshot-feature__link--muted" href="{{ '/whitepaper/' | relative_url }}#industry-reports">
          {{ include.secondary_label | default: "Browse industry articles" }}
        </a>
      {% endif %}
    </div>
  </section>
{% elsif include.show_empty %}
  <p>No national AI snapshot has been published yet. <a href="{{ '/whitepaper/' | relative_url }}">Browse the industry articles</a>.</p>
{% endif %}
