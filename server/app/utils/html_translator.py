# server/app/utils/html_translator.py
from bs4 import BeautifulSoup

def html_to_storage_format(html_content: str) -> str:
    """
    Translates HTML with custom placeholders into Confluence Storage Format XML.
    """
    if not html_content:
        return ""

    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all attachment placeholder divs
    placeholders = soup.find_all('div', attrs={'data-attachment-type': True})

    for placeholder in placeholders:
        attachment_type = placeholder.get('data-attachment-type')
        file_name = placeholder.get('data-file-name')

        if not file_name:
            continue
        
        # Use the <ac:image> tag for both images and videos. 
        # Confluence will render the correct player based on the file extension.
        if attachment_type == 'image' or attachment_type == 'video':
            macro = soup.new_tag('ac:image')
            attachment_ri = soup.new_tag('ri:attachment')
            attachment_ri['ri:filename'] = file_name
            macro.append(attachment_ri)
            # Replace the parent <p> tag if it exists, otherwise replace the div itself
            if placeholder.parent.name == 'p':
                placeholder.parent.replace_with(macro)
            else:
                placeholder.replace_with(macro)
            
        elif attachment_type == 'pdf':
            macro = soup.new_tag('ac:structured-macro')
            macro['ac:name'] = 'viewpdf'
            param = soup.new_tag('ac:parameter', attrs={'ac:name': 'name'})
            attachment_ri = soup.new_tag('ri:attachment')
            attachment_ri['ri:filename'] = file_name
            param.append(attachment_ri)
            macro.append(param)
            if placeholder.parent.name == 'p':
                placeholder.parent.replace_with(macro)
            else:
                placeholder.replace_with(macro)

    # Return the content of the <body> tag as a string
    return "".join(str(tag) for tag in soup.contents)