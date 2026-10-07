FROM pwn.red/jail
COPY --from=ubuntu:24.04 / /srv

COPY ./vuln /srv/app/run
RUN chmod +x /srv/app/run
COPY ./flag_part_1.txt /srv/app/flag_part_1.txt
COPY ./flag_part_2.txt /srv/app/flag_part_2.txt
COPY ./flag_part_3.txt /srv/app/flag_part_3.txt
COPY ./flag_4.txt /srv/app/flag_4.txt

ENV JAIL_PORT=5000
