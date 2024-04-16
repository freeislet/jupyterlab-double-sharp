import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

interface APODResponse {
  copyright: string;
  date: string;
  explanation: string;
  media_type: 'video' | 'image';
  title: string;
  url: string;
}

/**
 * Initialization data for the jupyterlab-double-sharp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-double-sharp',
  description: 'Convert comments starting with ## to Markdown',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension jupyterlab-double-sharp is activated!');
    console.log('ICommandPalette:', palette);

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log(
            'jupyterlab-double-sharp settings loaded:',
            settings.composite
          );
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for jupyterlab-double-sharp.',
            reason
          );
        });
    }

    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = async () => {
      // Create a blank content widget inside of a MainAreaWidget
      const content = new Widget();
      content.addClass('my-apodWidget');
      const widget = new MainAreaWidget({ content });
      widget.id = 'apod-jupyterlab';
      widget.title.label = 'Astronomy Picture';
      widget.title.closable = true;

      // 사진 보기
      // Add an image element to the content
      let img = document.createElement('img');
      content.node.appendChild(img);

      let summary = document.createElement('p');
      content.node.appendChild(summary);

      // Get a random date string in YYYY-MM-DD format
      function randomDate() {
        const start = new Date(2010, 1, 1);
        const end = new Date();
        const randomDate = new Date(
          start.getTime() + Math.random() * (end.getTime() - start.getTime())
        );
        return randomDate.toISOString().slice(0, 10);
      }

      // Fetch info about a random picture
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${randomDate()}`
      );
      if (!response.ok) {
        const data = await response.json();
        if (data.error) {
          summary.innerText = data.error.message;
        } else {
          summary.innerText = response.statusText;
        }
      } else {
        const data = (await response.json()) as APODResponse;

        if (data.media_type === 'image') {
          // Populate the image
          img.src = data.url;
          img.title = data.title;
          summary.innerText = data.title;
          if (data.copyright) {
            summary.innerText += ` (Copyright ${data.copyright})`;
          }
        } else {
          summary.innerText = 'Random APOD fetched was not an image.';
        }
      }

      return widget;
    };
    let widget = await newWidget();

    // Add an application command
    const command: string = 'double-sharp:open';
    app.commands.addCommand(command, {
      label: 'Random Astronomy Picture',
      execute: async () => {
        // Regenerate the widget if disposed
        if (widget.isDisposed) {
          widget = await newWidget();
        }
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        // Activate the widget
        app.shell.activateById(widget.id);
      }
    });

    // Add the command to the palette.
    palette.addItem({ command, category: 'Tutorial' });
  }
};

export default plugin;
