import json
import urllib.request
import csv

def get_region_names ():
    # Parse all sites url for region names
    all_sites_url = 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/all-sites.csv'
    response = urllib.request.urlopen(all_sites_url)

    lines = [line.decode('utf-8') for line in response.readlines()]

    region_names = []
    for row in csv.reader(lines[1:]): # Ignore the first line, i.e the CSV "key" line
        region_names.append(row[0])
    
    return region_names

mode_split_url = 'https://raw.githubusercontent.com/cyipt/actdev/main/data-small/{$region_name}/mode-split.csv'

def get_region_data (region_name):
    print ('Adding ' + region_name)
    url = mode_split_url.replace('{$region_name}', region_name)
    response = urllib.request.urlopen(url)
    
    lines = [line.decode('utf-8') for line in response.readlines()]
    
    walk_base = 0
    cycle_base = 0
    drive_base = 0
    other_base = 0
    for row in csv.reader(lines[1:]):
        walk_base += round(float(row[4]))
        cycle_base += round(float(row[5]))
        drive_base += round(float(row[6]))
        other_base += round(float(row[7]))
    
    return {
            'site_name': region_name,
            'walk_base': walk_base,
            'cycle_base': cycle_base,
            'drive_base': drive_base,
            'other_base': other_base
        }

def write_csv(data,filename):
    with open(filename, 'w+') as outf:
        writer = csv.DictWriter(outf, data[0].keys())
        writer.writeheader()
        for row in data:
            writer.writerow(row)


region_data = []

region_names = get_region_names()

for region_name in region_names:
    region_data.append(get_region_data(region_name))

print ('Finished getting data')

print (region_data)  

write_csv(region_data, 'small-site-stats.csv')

