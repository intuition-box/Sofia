FROM postgres:16-alpine

# Set environment variables
ENV POSTGRES_DB=eliza_db
ENV POSTGRES_USER=eliza
ENV POSTGRES_PASSWORD=changeme
ENV PGDATA=/var/lib/postgresql/data/pgdata

# Install additional extensions and tools
RUN apk add --no-cache \
    curl \
    postgresql-contrib

# Create directory for initialization scripts
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# Create custom postgresql.conf for better performance
RUN mkdir -p /etc/postgresql && \
    echo "# PostgreSQL configuration for Eliza" > /etc/postgresql/postgresql.conf && \
    echo "max_connections = 100" >> /etc/postgresql/postgresql.conf && \
    echo "shared_buffers = 256MB" >> /etc/postgresql/postgresql.conf && \
    echo "effective_cache_size = 1GB" >> /etc/postgresql/postgresql.conf && \
    echo "work_mem = 16MB" >> /etc/postgresql/postgresql.conf && \
    echo "maintenance_work_mem = 64MB" >> /etc/postgresql/postgresql.conf && \
    echo "wal_buffers = 8MB" >> /etc/postgresql/postgresql.conf && \
    echo "checkpoint_completion_target = 0.9" >> /etc/postgresql/postgresql.conf && \
    echo "random_page_cost = 1.1" >> /etc/postgresql/postgresql.conf && \
    echo "effective_io_concurrency = 200" >> /etc/postgresql/postgresql.conf && \
    echo "listen_addresses = '*'" >> /etc/postgresql/postgresql.conf && \
    echo "log_statement = 'all'" >> /etc/postgresql/postgresql.conf && \
    echo "log_duration = on" >> /etc/postgresql/postgresql.conf && \
    chmod 0644 /etc/postgresql/postgresql.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1

# Expose PostgreSQL port
EXPOSE 5432

# Use custom config
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
